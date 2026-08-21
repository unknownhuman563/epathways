<?php

namespace App\Http\Controllers;

use App\Models\SystemTicket;
use App\Models\User;
use App\Notifications\TicketSubmitted;
use App\Notifications\TicketUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SystemTicketController extends Controller
{
    /**
     * Any staff member (not an external lead) raises a request about the
     * system. Admins / super-admins are notified.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        abort_if($user->isLead(), 403, 'Only staff can submit tickets.');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'description' => ['required', 'string', 'max:5000'],
            'category' => ['required', Rule::in(SystemTicket::CATEGORIES)],
            'priority' => ['nullable', Rule::in(SystemTicket::PRIORITIES)],
            // Up to 5 screenshots so the admin can see the exact screen.
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'mimes:jpeg,jpg,png,webp,gif', 'max:5120'],
        ]);

        $ticket = SystemTicket::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'category' => $data['category'],
            'priority' => $data['priority'] ?? 'normal',
            'status' => 'open',
            'submitted_by' => $user->id,
            'department' => $user->role,
        ]);

        // Store screenshots on the private disk (they can contain client data);
        // they're served back through the auth-gated image() stream below.
        if ($request->hasFile('images')) {
            $paths = [];
            foreach ($request->file('images') as $img) {
                $paths[] = $img->store("system-tickets/{$ticket->id}", 'local');
            }
            $ticket->update(['images' => $paths]);
        }

        $recipients = User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])->get();
        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, new TicketSubmitted($ticket, $user->name));
        }

        return back()->with('success', "Ticket {$ticket->ticket_ref} submitted — thank you!");
    }

    /**
     * Staff-facing list of the tickets the current user has raised, with
     * status + the admin's reply. Renders inside the user's own portal
     * layout (app.jsx auto-wraps by the component-name prefix). Admins /
     * super-admins don't have a personal list — they get the full board.
     */
    public function myTickets(Request $request)
    {
        $user = $request->user();
        abort_if($user->isLead(), 403, 'Only staff can view tickets.');

        if (in_array($user->role, [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN], true)) {
            return redirect('/admin/system-tickets');
        }

        $mine = SystemTicket::where('submitted_by', $user->id);

        $tickets = (clone $mine)
            ->with('resolver:id,name')
            ->orderByRaw("CASE WHEN status IN ('done','declined') THEN 1 ELSE 0 END")
            ->orderByDesc('created_at')
            ->paginate(15)
            ->through(fn (SystemTicket $t) => $this->serialize($t));

        return inertia($this->myTicketsPage($user), [
            'tickets' => $tickets,
            'counts' => [
                'open' => (clone $mine)->open()->count(),
                'total' => (clone $mine)->count(),
            ],
            'meta' => [
                'categories' => SystemTicket::CATEGORIES,
                'priorities' => SystemTicket::PRIORITIES,
            ],
        ]);
    }

    /** Pick the per-portal page so the shared list wraps in the right layout. */
    private function myTicketsPage($user): string
    {
        return match ($user->role) {
            'sales' => 'portal/sales/Tickets',
            'education' => 'portal/education/Tickets',
            'english' => 'portal/english/Tickets',
            'accommodation' => 'portal/accommodation/Tickets',
            'immigration', 'immigration_manager', 'immigration_adviser' => 'portal/immigration/Tickets',
            default => 'portal/sales/Tickets',
        };
    }

    /** Admin / super-admin triage board of every ticket. */
    public function adminIndex(Request $request)
    {
        $status = $request->query('status');
        $dept = $request->query('department');
        $search = trim((string) $request->query('search', ''));

        $base = SystemTicket::query()
            ->with(['submitter:id,name,role', 'resolver:id,name'])
            ->when($status && in_array($status, SystemTicket::STATUSES, true), fn ($q) => $q->where('status', $status))
            ->when($dept, fn ($q) => $q->where('department', $dept))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('ticket_ref', 'like', "%{$search}%")));

        $tickets = (clone $base)
            ->orderByRaw("CASE WHEN status IN ('done','declined') THEN 1 ELSE 0 END")
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (SystemTicket $t) => $this->serialize($t));

        return inertia('admin/SystemTickets', [
            'tickets' => $tickets,
            'filters' => ['status' => $status, 'department' => $dept, 'search' => $search],
            'meta' => [
                'categories' => SystemTicket::CATEGORIES,
                'priorities' => SystemTicket::PRIORITIES,
                'statuses' => SystemTicket::STATUSES,
            ],
            'counts' => ['open' => SystemTicket::open()->count()],
        ]);
    }

    public function adminUpdate(Request $request, $id)
    {
        $ticket = SystemTicket::findOrFail($id);

        $data = $request->validate([
            'status' => ['required', Rule::in(SystemTicket::STATUSES)],
            'admin_response' => ['nullable', 'string', 'max:5000'],
        ]);

        $resolved = in_array($data['status'], ['done', 'declined'], true);
        $ticket->update([
            'status' => $data['status'],
            'admin_response' => $data['admin_response'] ?? $ticket->admin_response,
            'resolved_by' => $resolved ? $request->user()->id : null,
            'resolved_at' => $resolved ? now() : null,
        ]);

        // Tell the department who raised it.
        if ($ticket->submitter) {
            $ticket->submitter->notify(new TicketUpdated($ticket->fresh()));
        }

        return back()->with('success', "Ticket {$ticket->ticket_ref} updated.");
    }

    /**
     * Stream one of a ticket's screenshots from the private disk. Gated to the
     * admins/super-admins (the triagers) and the staff member who raised it —
     * EnsurePortalAccess is role-level only, so ownership is re-checked here.
     */
    public function image(Request $request, int $id, int $index)
    {
        $user = $request->user();
        abort_if($user->isLead(), 403);

        $ticket = SystemTicket::findOrFail($id);
        abort_unless(
            $user->isAtLeast('admin') || $ticket->submitted_by === $user->id,
            403,
        );

        $images = $ticket->images ?? [];
        abort_unless(isset($images[$index]) && Storage::disk('local')->exists($images[$index]), 404);

        return response()->file(Storage::disk('local')->path($images[$index]));
    }

    private function serialize(SystemTicket $t): array
    {
        return [
            'id' => $t->id,
            'ticket_ref' => $t->ticket_ref,
            'title' => $t->title,
            'description' => $t->description,
            'category' => $t->category,
            'priority' => $t->priority,
            'status' => $t->status,
            'department' => $t->department,
            'submitter' => optional($t->submitter)->name,
            'admin_response' => $t->admin_response,
            'resolver' => optional($t->resolver)->name,
            // Auth-gated stream URLs for each screenshot (never the raw path).
            'images' => collect($t->images ?? [])
                ->keys()
                ->map(fn ($i) => url("/system-tickets/{$t->id}/images/{$i}"))
                ->all(),
            'created_at' => optional($t->created_at)?->toIso8601String(),
            'resolved_at' => optional($t->resolved_at)?->toIso8601String(),
        ];
    }
}
