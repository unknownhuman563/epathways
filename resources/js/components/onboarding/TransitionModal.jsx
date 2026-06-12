import { useForm } from "@inertiajs/react";
import { X } from "lucide-react";
import { STAGE_INPUTS, statusLabel } from "@/lib/onboardingMeta";

const FIELD = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1F5A8B] focus:ring-[#1F5A8B]";
const LABEL = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

/**
 * Collects the data a stage transition needs (e.g. viewing date, invoice
 * amount, decline reason) then PATCHes the status. Targets with no inputs are
 * handled by a direct PATCH at the call site, not this modal.
 */
export default function TransitionModal({ submission, target, onClose }) {
    const inputs = STAGE_INPUTS[target] ?? [];
    const initial = inputs.reduce((acc, i) => ({ ...acc, [i.name]: "" }), { status: target });
    const { data, setData, patch, processing, errors } = useForm(initial);

    const submit = (e) => {
        e.preventDefault();
        patch(`/portal/accommodation/applications/${submission.id}/status`, { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Move to {statusLabel(target)}</h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {inputs.map((input) => (
                        <div key={input.name}>
                            <label className={LABEL}>{input.label}</label>
                            {input.type === "textarea" ? (
                                <textarea rows={3} className={FIELD} value={data[input.name]} onChange={(e) => setData(input.name, e.target.value)} />
                            ) : (
                                <input type={input.type} step={input.type === "number" ? "0.01" : undefined} className={FIELD} value={data[input.name]} onChange={(e) => setData(input.name, e.target.value)} />
                            )}
                            {errors[input.name] && <p className="mt-1 text-xs text-rose-600">{errors[input.name]}</p>}
                        </div>
                    ))}
                    {errors.status && <p className="text-xs text-rose-600">{errors.status}</p>}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                        <button type="submit" disabled={processing} className="rounded-full bg-[#1F5A8B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#184A73] disabled:opacity-50">
                            {processing ? "Saving…" : "Confirm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
