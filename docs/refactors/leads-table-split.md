# Refactor plan — splitting the wide `leads` table

**Status:** planned, not started
**Owner:** —
**Why now:** the `leads` table has **212 columns**. Adding `nzer_number` hit InnoDB's
~8126-byte in-row limit (`SQLSTATE 1118 "Row size too large"`) on production. We fixed
the immediate failure by converting the table to `ROW_FORMAT=DYNAMIC`
(`2026_08_28_000000_add_nzer_number_to_leads`), which bought headroom — but the table
is still a "god table" and will keep growing. This doc is the plan to slim it down
safely, when we choose to.

> **This is not urgent.** DYNAMIC row format gives lots of headroom and there's no
> performance problem at current data sizes. Do this deliberately, as its own tested,
> carefully-deployed change — never squeezed in alongside feature work.

---

## 1. The strategy: strangler pattern, one group at a time

Never move all columns at once — hundreds of call sites read `$lead->inz_status` etc.
Instead, extract **one cohesive group** into a 1-to-1 satellite table linked by
`lead_id`, keep the app working the whole time via **read accessors**, then drop the
old columns once nothing writes them directly.

Each extraction is small, independently shippable, and reversible.

### The backward-compat trick (why this is safe)
Add an accessor on `Lead` so existing reads keep working after the column is gone:

```php
// Lead.php
public function portalInvitation(): HasOne
{
    return $this->hasOne(LeadPortalInvitation::class)->withDefault();
}

// Old reads (BuildsLeadRow, row payloads, JS-fed payloads) keep working unchanged:
public function getPortalInvitationStatusAttribute(): ?string
{
    return $this->portalInvitation->status;
}
```

Reads are easy. **Writes are the hard part** — `$lead->portal_invitation_status = X;
$lead->save()` does not auto-persist to a related model. So the writers (concentrated
in one controller) must be rewritten to use the relation.

---

## 2. Extraction order (highest value ÷ risk first)

| # | Group | ~cols | Risk | Notes |
|---|---|---|---|---|
| 1 | `portal_invitation_*` | 8 | low-med | Writes concentrated in `LeadPortalInvitationController` (~51 refs). Good **pilot**. |
| 2 | `engagement_*` (fees/token) | 9 | low | Cohesive; one feature. |
| 3 | Assessment intake block | ~60 | med | **Biggest win.** `english_test_*`, `employment_*`, `funding_*`, `highest_qualification*`, family + disclosures. Only relevant to intake leads. |
| 4 | `inz_*` / passport / current visa | ~18 | med-high | Most call sites; do last. |

Doing just #1–#3 takes `leads` from 212 → ~135 and removes most of the empty-column
waste (a pure sales lead has no immigration/assessment data).

---

## 3. Worked example — the `portal_invitation_*` pilot

**Columns to move (8):**
`portal_invitation_status`, `portal_invitation_requested_by`,
`portal_invitation_requested_at`, `portal_invitation_approved_by`,
`portal_invitation_approved_at`, `portal_invitation_token`,
`portal_invitation_expires_at`, `portal_invitation_accepted_at`.

**Call sites (surveyed 2026-08):** 64 PHP refs — **51 in `LeadPortalInvitationController`**
(the writers), 9 in `Lead.php`, 1 each in `BuildsLeadRow`, `Portal\ImmigrationController`,
`Portal\EducationController`, `LeadDocumentController`, `DefaultMessageTemplatesSeeder`.
JS refs (Leads/Cases/Students/LeadDocuments/LeadDetails) only **read**
`portal_invitation_status` from row payloads — no JS change needed if the accessor keeps
the payload field populated.

### New table

```php
Schema::create('lead_portal_invitations', function (Blueprint $t) {
    $t->id();
    $t->foreignId('lead_id')->unique()->constrained()->cascadeOnDelete();
    $t->string('status')->nullable();            // was portal_invitation_status
    $t->foreignId('requested_by')->nullable();   // was portal_invitation_requested_by
    $t->timestamp('requested_at')->nullable();
    $t->foreignId('approved_by')->nullable();
    $t->timestamp('approved_at')->nullable();
    $t->string('token', 64)->nullable()->unique();
    $t->timestamp('expires_at')->nullable();
    $t->timestamp('accepted_at')->nullable();
    $t->timestamps();
});
```

### Model

```php
class LeadPortalInvitation extends Model
{
    protected $fillable = [
        'lead_id', 'status', 'requested_by', 'requested_at', 'approved_by',
        'approved_at', 'token', 'expires_at', 'accepted_at',
    ];
    protected $casts = [
        'requested_at' => 'datetime', 'approved_at' => 'datetime',
        'expires_at' => 'datetime', 'accepted_at' => 'datetime',
    ];
    public function lead(): BelongsTo { return $this->belongsTo(Lead::class); }
}
```

### Lead model
- Add `portalInvitation(): HasOne` (with `->withDefault(['status' => 'none'])`).
- Add read accessors for each of the 8 old attribute names, proxying to the relation, so
  `BuildsLeadRow`, the row payloads and existing helpers keep working unchanged.
- Remove the 8 names from `$fillable`.

### Controller rewrite (`LeadPortalInvitationController`)
Replace direct column writes with relation writes, e.g.:

```php
// before
$lead->update([
    'portal_invitation_status' => 'requested',
    'portal_invitation_requested_by' => auth()->id(),
    'portal_invitation_requested_at' => now(),
]);

// after
$lead->portalInvitation()->updateOrCreate([], [
    'status' => 'requested',
    'requested_by' => auth()->id(),
    'requested_at' => now(),
]);
```

Reads inside the controller (`$lead->portal_invitation_status`) keep working via the
accessor, so only the ~writes change.

### Drop the old columns (Phase 2 migration — see §4)

```php
Schema::table('leads', function (Blueprint $t) {
    $t->dropColumn([
        'portal_invitation_status', 'portal_invitation_requested_by',
        'portal_invitation_requested_at', 'portal_invitation_approved_by',
        'portal_invitation_approved_at', 'portal_invitation_token',
        'portal_invitation_expires_at', 'portal_invitation_accepted_at',
    ]);
});
```

---

## 4. Safe production rollout — TWO deploys

DDL is not transactional in MySQL, so never backfill-and-drop in one shot on a live
table. Split across two deploys with a verification window between:

**Deploy 1 — additive + dual-write (fully reversible, no data loss):**
1. Migration: create `lead_portal_invitations`, then **backfill** from `leads` (chunked).
2. Ship the model, relation, accessors.
3. Rewrite the controller to write to the relation, **and keep writing the old columns too**
   (dual-write) so both stay in sync. Reads come from the relation.
4. Deploy. Verify in production for a day or two: new rows land in the satellite,
   invitation flow works end to end, row payloads still show status.

**Deploy 2 — drop the columns (destructive, only after Deploy 1 is proven):**
1. Remove the dual-write (columns are now unused).
2. Migration: `dropColumn(...)` the 8 columns from `leads`.
3. Deploy.

If anything looks wrong after Deploy 1, you simply revert the code — the columns are
still there and authoritative. The point of no return is only Deploy 2.

---

## 5. Testing checklist (before each deploy)
- [ ] `composer test` green (add/adjust tests for the invitation lifecycle).
- [ ] Request → approve → generate credentials → accept, end to end, on a seeded lead.
- [ ] Cases / Students / Leads tables still show the correct invitation status pill.
- [ ] `BuildsLeadRow` payload still contains `portal_invitation_status`.
- [ ] Backfill count matches: `lead_portal_invitations` rows == leads with a non-null
      `portal_invitation_status`.

## 6. Rollback
- **Deploy 1:** revert code; drop `lead_portal_invitations` if desired. Old columns
  untouched, so zero data loss.
- **Deploy 2:** the `down()` re-adds the columns; re-backfill from
  `lead_portal_invitations` before removing it. Keep the satellite table until you're
  certain.

---

## 7. Notes / gotchas specific to this codebase
- `portal_invitation_status` is read by **`BuildsLeadRow`** and custom row payloads
  (Cases, Students) — CLAUDE.md warns these payloads must *explicitly* include row-menu
  fields. The accessor keeps them working, but verify each payload still surfaces it.
- The `token` column has a `unique()` index — preserve it on the new table.
- `requested_by` / `approved_by` reference `users.id` — keep them as FKs (or plain
  `foreignId` nullable) to match current behaviour.
- Tests force sqlite; the migration must be driver-agnostic (plain Schema builder, no
  raw MySQL). Backfill via the query builder works on both.

---

## 8. Cheaper alternative (if a full split is ever too much)
Several `*_info` fields are already JSON. Rarely-queried structured data (e.g. disclosure
notes) *could* collapse into a single JSON column instead of many columns — no join, no
satellite table. Only for data you never filter/sort on in SQL. Don't JSON-ify anything
you search by (that's why the INZ identifiers stayed real columns).
