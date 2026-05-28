import React, { useEffect, useState } from 'react';
import { ArrowRight, Tag, Clock, X, Plus } from 'lucide-react';

/**
 * Public promo strip / carousel — accepts the array shape produced by
 * App\Services\PromoFeed::active(). Renders nothing if the list is empty,
 * so safe to drop into any page unconditionally.
 *
 *   <PromoBanner promos={activePromos} />
 *
 * Variants:
 *   variant="strip"  — slim, full-width bar (default; sits below navbar)
 *   variant="card"   — bigger card with image, for listing pages
 */
export default function PromoBanner({ promos = [], variant = 'strip', className = '' }) {
    const [dismissed, setDismissed] = useState(false);
    const [index, setIndex] = useState(0);

    const list = Array.isArray(promos) ? promos.filter(Boolean) : [];

    // Card variant still auto-rotates (it's a hero-style block on listing
    // pages). The strip variant now stays pinned on the top promo (biggest
    // discount) and routes additional offers to the PromoModal instead.
    useEffect(() => {
        if (variant !== 'card' || list.length < 2) return;
        const id = setInterval(() => setIndex(i => (i + 1) % list.length), 6000);
        return () => clearInterval(id);
    }, [list.length, variant]);

    if (!list.length || dismissed) return null;

    const promo = variant === 'card' ? (list[index] || list[0]) : list[0];
    const extraCount = variant === 'strip' ? Math.max(0, list.length - 1) : 0;
    const openPromoModal = () => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('open-promo-modal'));
        }
    };
    const daysLeft = promo.date_end ? daysUntil(promo.date_end) : null;
    const cta = promo.cta_link || (promo.program?.slug ? `/program-details/${promo.program.slug}` : '/programs-levels');
    const ctaLabel = promo.cta_label || 'View programme';
    const percentLabel = formatPercent(promo.percent);

    if (variant === 'card') {
        return (
            <section className={`w-full py-12 bg-gradient-to-br from-amber-50 via-rose-50 to-white ${className}`}>
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-rose-600 block mb-2">
                                Limited-time promo{list.length > 1 ? `s · ${list.length} live` : ''}
                            </span>
                            <h2 className="text-3xl md:text-4xl font-medium text-[#1a1a1a]">Save on your next programme</h2>
                        </div>
                        {list.length > 1 && (
                            <div className="hidden md:flex items-center gap-1.5">
                                {list.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setIndex(i)}
                                        aria-label={`Promo ${i + 1}`}
                                        className={`h-1.5 rounded-full transition-all ${i === index ? 'bg-[#1a1a1a] w-8' : 'bg-gray-300 w-3 hover:bg-gray-400'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="lg:col-span-2 relative bg-gradient-to-br from-rose-100 to-amber-100 min-h-[220px] flex items-center justify-center">
                            {promo.image_url ? (
                                <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover absolute inset-0" />
                            ) : (
                                <div className="text-center p-8 relative z-10">
                                    <div className="text-6xl md:text-7xl font-black text-rose-600 leading-none">{percentLabel}</div>
                                    <div className="text-xs font-bold tracking-[0.3em] uppercase text-rose-500 mt-2">off</div>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-3 p-8 md:p-10 flex flex-col">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest rounded">
                                    <Tag size={11} /> {percentLabel} off
                                </span>
                                {promo.program?.title && (
                                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500">
                                        {promo.program.title}
                                    </span>
                                )}
                                {daysLeft != null && daysLeft >= 0 && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600">
                                        <Clock size={11} /> {daysLeft === 0 ? 'Ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-2xl md:text-3xl font-medium text-[#1a1a1a] mb-3 leading-tight">{promo.title}</h3>
                            {promo.description && (
                                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">{promo.description}</p>
                            )}
                            {promo.promo_code && (
                                <div className="mb-6 inline-flex items-center gap-2 text-xs text-gray-700">
                                    Use code
                                    <code className="px-2 py-1 bg-gray-100 border border-gray-200 rounded font-mono font-bold text-rose-700">{promo.promo_code}</code>
                                </div>
                            )}
                            <a
                                href={cta}
                                className="inline-flex items-center gap-2 self-start bg-[#1a1a1a] text-white px-7 py-3 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all shadow"
                            >
                                {ctaLabel} <ArrowRight size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div className={`w-full bg-[#1a1a1a] text-white ${className}`}>
            <div className="container mx-auto px-6 max-w-7xl py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-wrap justify-center text-sm">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-500 text-white rounded text-[10px] font-bold uppercase tracking-widest">
                        <Tag size={11} /> {percentLabel} off
                    </span>
                    <span className="font-semibold">{promo.title}</span>
                    {promo.program?.title && (
                        <span className="text-white/70 hidden md:inline">· {promo.program.title}</span>
                    )}
                    {daysLeft != null && daysLeft >= 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-white/80">
                            <Clock size={11} /> {daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href={cta}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#1a1a1a] text-[11px] font-bold uppercase tracking-widest rounded hover:bg-gray-100 transition-colors"
                    >
                        {ctaLabel} <ArrowRight size={12} />
                    </a>
                    {extraCount > 0 && (
                        <button
                            onClick={openPromoModal}
                            aria-label={`See ${extraCount} more offer${extraCount === 1 ? '' : 's'}`}
                            className="inline-flex items-center gap-1 px-2 py-1 border border-white/30 hover:border-white/70 text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
                        >
                            <Plus size={10} /> {extraCount} more
                        </button>
                    )}
                    <button
                        onClick={() => setDismissed(true)}
                        aria-label="Dismiss promo"
                        className="text-white/60 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function daysUntil(iso) {
    if (!iso) return null;
    const end = new Date(iso + 'T23:59:59');
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
}

function formatPercent(value) {
    const n = Number(value || 0);
    if (Number.isInteger(n)) return `${n}%`;
    return `${n.toFixed(2).replace(/\.?0+$/, '')}%`;
}
