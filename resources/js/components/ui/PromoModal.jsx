import { useEffect, useState } from "react";
import { ArrowRight, Tag, Clock, X, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";

const DISMISS_KEY = "epathways_promos_seen_at";
const WELCOME_KEY = "epathways_welcome_dismissed_at";
const SHOW_AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 1 week — matches WelcomeModal cadence

/**
 * Visit-time promo modal.
 *
 *   <PromoModal promos={activePromos} />
 *
 * Auto-opens on first visit per week if there are active promos.
 * Visitors can also force-open it from the strip's "+N more" pill via
 * the global `window.dispatchEvent(new Event('open-promo-modal'))` signal.
 *
 * Dismissal writes BOTH the promo key AND the welcome key so the welcome
 * modal doesn't fire on the same visit — one popup per landing is the rule.
 */
export default function PromoModal({ promos = [] }) {
    const list = Array.isArray(promos) ? promos.filter(Boolean) : [];

    const [isOpen, setIsOpen] = useState(false);
    const [index, setIndex] = useState(0);
    // For 4+ promos we offer a scrollable grid as an alternative to the hero
    // carousel — gives a single scannable view instead of click-through.
    const [view, setView] = useState('hero'); // 'hero' | 'grid'

    // Auto-open on first visit per week (only if promos exist).
    useEffect(() => {
        if (!list.length) return;
        let last = 0;
        try { last = Number(window.localStorage.getItem(DISMISS_KEY) || 0); } catch {}
        if (!last || Date.now() - last > SHOW_AGAIN_AFTER_MS) {
            // Small delay so the modal doesn't paint at the same instant as
            // the hero — feels less aggressive.
            const t = setTimeout(() => setIsOpen(true), 1200);
            return () => clearTimeout(t);
        }
    }, [list.length]);

    // Listen for the strip's "+N more" pill click.
    useEffect(() => {
        const open = () => {
            setIndex(0);
            // When opened via the "+N more" pill, jump straight to the grid
            // since the visitor explicitly wanted to see all offers.
            setView(list.length >= 4 ? 'grid' : 'hero');
            setIsOpen(true);
        };
        window.addEventListener('open-promo-modal', open);
        return () => window.removeEventListener('open-promo-modal', open);
    }, [list.length]);

    // Lock body scroll while open.
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!isOpen || !list.length) return null;

    const promo = list[index] || list[0];
    const daysLeft = promo.date_end ? daysUntil(promo.date_end) : null;
    const cta = promo.cta_link || (promo.program?.slug ? `/program-details/${promo.program.slug}` : '/programs-levels');
    const ctaLabel = promo.cta_label || 'View programme';
    const percentLabel = formatPercent(promo.percent);

    const dismiss = () => {
        const now = String(Date.now());
        try {
            window.localStorage.setItem(DISMISS_KEY, now);
            window.localStorage.setItem(WELCOME_KEY, now); // suppress welcome on the same visit
        } catch { /* private mode */ }
        setIsOpen(false);
    };

    const next = () => setIndex(i => (i + 1) % list.length);
    const prev = () => setIndex(i => (i - 1 + list.length) % list.length);

    const markEngaged = () => {
        try {
            const now = String(Date.now());
            window.localStorage.setItem(DISMISS_KEY, now);
            window.localStorage.setItem(WELCOME_KEY, now);
        } catch {}
    };

    const showGridToggle = list.length >= 4;

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[60] p-4 sm:p-6">
            <div className={`relative w-full ${view === 'grid' ? 'max-w-5xl' : 'max-w-4xl'} animate-modal-in`}>
                <div className="bg-white shadow-2xl overflow-hidden">
                    {view === 'hero' ? (
                        <HeroView
                            promo={promo}
                            index={index}
                            list={list}
                            percentLabel={percentLabel}
                            daysLeft={daysLeft}
                            cta={cta}
                            ctaLabel={ctaLabel}
                            dismiss={dismiss}
                            markEngaged={markEngaged}
                            prev={prev}
                            next={next}
                            showGridToggle={showGridToggle}
                            onShowGrid={() => setView('grid')}
                        />
                    ) : (
                        <GridView
                            list={list}
                            dismiss={dismiss}
                            markEngaged={markEngaged}
                            onShowHero={(i) => { setIndex(i); setView('hero'); }}
                        />
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes modalIn {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-modal-in { animation: modalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </div>
    );
}

function HeroView({ promo, index, list, percentLabel, daysLeft, cta, ctaLabel, dismiss, markEngaged, prev, next, showGridToggle, onShowGrid }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[200px] md:min-h-[480px]">
            {/* LEFT — full-bleed visual. Falls back to program image, then % text. */}
            <div className="relative bg-[#1a1a1a] min-h-[240px] md:min-h-full flex items-center justify-center overflow-hidden">
                {promo.image_url ? (
                    <img src={promo.image_url} alt={promo.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="text-center px-6 relative z-10">
                        <div className="text-7xl md:text-8xl font-black text-white leading-none">{percentLabel}</div>
                        <div className="text-[11px] font-bold tracking-[0.4em] uppercase text-white/60 mt-3">off</div>
                    </div>
                )}
            </div>

            {/* RIGHT — content panel */}
            <div className="relative bg-white p-8 md:p-10 flex flex-col">
                <button
                    onClick={dismiss}
                    aria-label="Close"
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center justify-between mb-5 pr-10">
                    <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-500">
                        {list.length === 1 ? 'Limited-time offer' : `${list.length} live offers · ${index + 1} of ${list.length}`}
                    </div>
                    {showGridToggle && (
                        <button
                            onClick={onShowGrid}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#1a1a1a] transition-colors"
                        >
                            <LayoutGrid size={12} /> View all
                        </button>
                    )}
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] leading-[1.1] tracking-tight mb-5">
                    {promo.title}
                </h3>

                {promo.program?.title && (
                    <div className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-4">
                        {promo.program.title}
                    </div>
                )}

                {promo.description && (
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
                        {promo.description}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1a1a] text-white text-[10px] font-bold uppercase tracking-widest">
                        <Tag size={11} /> {percentLabel} off
                    </span>
                    {daysLeft != null && daysLeft >= 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600">
                            <Clock size={11} /> {daysLeft === 0 ? 'Ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                        </span>
                    )}
                </div>

                {promo.promo_code && (
                    <div className="mb-6 inline-flex items-center gap-2 text-xs text-gray-700">
                        Use code
                        <code className="px-2.5 py-1 bg-gray-100 border border-gray-200 font-mono font-bold text-[#1a1a1a] tracking-wider">
                            {promo.promo_code}
                        </code>
                    </div>
                )}

                <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between gap-3">
                    {list.length > 1 ? (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={prev}
                                aria-label="Previous offer"
                                className="w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={next}
                                aria-label="Next offer"
                                className="w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    ) : <span />}

                    <a
                        href={cta}
                        onClick={markEngaged}
                        className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.22em] hover:bg-black transition-colors"
                    >
                        {ctaLabel} <ArrowRight size={13} />
                    </a>
                </div>
            </div>
        </div>
    );
}

function GridView({ list, dismiss, markEngaged, onShowHero }) {
    return (
        <div className="relative flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-100 flex-shrink-0">
                <div>
                    <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-500 mb-1">All live offers</div>
                    <h3 className="text-xl md:text-2xl font-bold text-[#1a1a1a] tracking-tight">{list.length} promotions available</h3>
                </div>
                <button
                    onClick={dismiss}
                    aria-label="Close"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="overflow-y-auto px-6 md:px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((p, i) => {
                    const days = p.date_end ? Math.ceil((new Date(p.date_end + 'T23:59:59') - new Date()) / 86400000) : null;
                    const pct = formatPercent(p.percent);
                    const link = p.cta_link || (p.program?.slug ? `/program-details/${p.program.slug}` : '/programs-levels');
                    return (
                        <div key={p.id ?? i} className="group border border-gray-200 hover:border-[#1a1a1a] transition-colors overflow-hidden flex flex-col">
                            <button
                                onClick={() => onShowHero(i)}
                                className="relative h-40 bg-[#1a1a1a] flex items-center justify-center overflow-hidden text-left"
                                aria-label={`View ${p.title}`}
                            >
                                {p.image_url ? (
                                    <img src={p.image_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="text-4xl font-black text-white">{pct}</div>
                                )}
                                <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 bg-[#1a1a1a] text-white text-[10px] font-bold uppercase tracking-widest">
                                    <Tag size={10} /> {pct} off
                                </span>
                            </button>
                            <div className="p-4 flex-1 flex flex-col">
                                {p.program?.title && (
                                    <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1.5">{p.program.title}</div>
                                )}
                                <h4 className="text-base font-semibold text-[#1a1a1a] leading-snug mb-2 line-clamp-2">{p.title}</h4>
                                <div className="flex items-center justify-between mt-auto pt-3">
                                    {days != null && days >= 0 ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                                            <Clock size={10} /> {days === 0 ? 'Ends today' : `${days}d left`}
                                        </span>
                                    ) : <span />}
                                    <a
                                        href={link}
                                        onClick={markEngaged}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a] hover:text-black"
                                    >
                                        {p.cta_label || 'View'} <ArrowRight size={11} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function daysUntil(iso) {
    if (!iso) return null;
    const end = new Date(iso + 'T23:59:59');
    const now = new Date();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

function formatPercent(value) {
    const n = Number(value || 0);
    if (Number.isInteger(n)) return `${n}%`;
    return `${n.toFixed(2).replace(/\.?0+$/, '')}%`;
}
