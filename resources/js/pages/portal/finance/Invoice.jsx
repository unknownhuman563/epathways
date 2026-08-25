// Finance sees the exact same Invoice module as the immigration portal —
// generated invoices, the Details column (onshore/offshore · country · GST),
// and the proof-of-payment verification table. Re-exporting the immigration
// page guarantees the two never drift apart; the finance layout is applied by
// PORTAL_LAYOUTS from this file's "portal/finance/Invoice" path.
export { default } from "@/pages/portal/immigration/Invoice";
