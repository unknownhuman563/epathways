import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Calendar as CalendarIcon, List as ListIcon, Filter,
    ChevronLeft, ChevronRight, X, Trash2,
} from 'lucide-react';
import { social } from '@/services/social';
import {
    Skeleton, PlatformIcon, ServiceChip, EmptyState,
} from './atoms';
import { PLATFORMS, PLATFORM_BY_ID, SERVICES, SERVICE_BY_ID } from './constants';
import {
    formatHuman, sameDay, addDays, startOfWeek, gradientForService,
} from './helpers';

// Scheduler with week / month / list views, drag-to-reschedule, and a
// post-details modal. Same prop contract as the original inline section:
//   posts = null | array of scheduled posts
//   onMutate(updater) — updater(prevArray) -> nextArray
export default function SchedulerSection({ posts, onMutate }) {
    const [view, setView] = useState('week'); // week | month | list
    const [cursor, setCursor] = useState(() => startOfWeek(new Date())); // Date that anchors the view
    const [serviceFilter, setServiceFilter] = useState('all');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [activePost, setActivePost] = useState(null);

    const filtered = useMemo(() => {
        if (!posts) return null;
        return posts.filter((p) =>
            (serviceFilter === 'all'  || p.service  === serviceFilter) &&
            (platformFilter === 'all' || p.platform === platformFilter)
        );
    }, [posts, serviceFilter, platformFilter]);

    const onRescheduleDrop = async (post, newDate) => {
        const newIso = newDate.toISOString();
        const previous = post.schedule_at;
        // Optimistic
        onMutate((prev) => prev.map((p) => p.id === post.id ? { ...p, schedule_at: newIso } : p));
        try {
            await social.reschedule(post.id, newIso);
            toast.success(`Moved to ${formatHuman(newIso)}`);
        } catch {
            onMutate((prev) => prev.map((p) => p.id === post.id ? { ...p, schedule_at: previous } : p));
            toast.error('Could not move that post');
        }
    };

    const onCancel = async (post) => {
        if (!confirm(`Cancel "${post.headline}"?`)) return;
        onMutate((prev) => prev.filter((p) => p.id !== post.id));
        try { await social.cancelPost(post.id); toast.success('Post cancelled'); }
        catch {
            onMutate((prev) => [post, ...prev]);
            toast.error('Could not cancel');
        }
    };

    return (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                <CalendarIcon size={16} className="text-gray-700" />
                <h2 className="text-sm font-bold text-gray-900">Scheduled posts</h2>

                <div className="ml-auto flex items-center gap-2 flex-wrap">
                    {/* Filters */}
                    <Filter size={13} className="text-gray-500" />
                    <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white">
                        <option value="all">All services</option>
                        {SERVICES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white">
                        <option value="all">All platforms</option>
                        {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>

                    <div className="w-px h-5 bg-gray-200 mx-1" />

                    {/* View toggles */}
                    {['week', 'month', 'list'].map((v) => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => setView(v)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                                view === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            {v === 'list' ? <ListIcon size={12} /> : <CalendarIcon size={12} />}
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {filtered === null ? (
                <div className="p-6 grid grid-cols-7 gap-2">
                    {Array.from({ length: 21 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-6">
                    <EmptyState
                        icon={<CalendarIcon size={20} className="text-gray-500" />}
                        title="Nothing scheduled"
                        body="Approve variants above to schedule them."
                    />
                </div>
            ) : view === 'week' ? (
                <WeekView cursor={cursor} setCursor={setCursor} posts={filtered} onOpen={setActivePost} onDrop={onRescheduleDrop} />
            ) : view === 'month' ? (
                <MonthView cursor={cursor} setCursor={setCursor} posts={filtered} onOpen={setActivePost} onDrop={onRescheduleDrop} />
            ) : (
                <ListView posts={filtered} onOpen={setActivePost} />
            )}

            {activePost && (
                <PostDetailsModal post={activePost} onClose={() => setActivePost(null)} onCancel={() => { onCancel(activePost); setActivePost(null); }} />
            )}
        </section>
    );
}

function WeekView({ cursor, setCursor, posts, onOpen, onDrop }) {
    const start = startOfWeek(cursor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    return (
        <div className="p-6">
            <CalendarHeader
                label={`${days[0].toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                onPrev={() => setCursor(addDays(start, -7))}
                onNext={() => setCursor(addDays(start, 7))}
                onToday={() => setCursor(startOfWeek(new Date()))}
            />

            <div className="grid grid-cols-7 gap-2">
                {days.map((d) => {
                    const dayPosts = posts.filter((p) => sameDay(new Date(p.schedule_at), d));
                    const isToday = sameDay(d, new Date());
                    return (
                        <DayCell
                            key={d.toISOString()}
                            date={d}
                            isToday={isToday}
                            posts={dayPosts}
                            onOpen={onOpen}
                            onDrop={onDrop}
                            minHeight={140}
                            showWeekday
                        />
                    );
                })}
            </div>
        </div>
    );
}

function MonthView({ cursor, setCursor, posts, onOpen, onDrop }) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(monthStart);
    // 6 weeks max to cover any month
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const inMonth = (d) => d.getMonth() === cursor.getMonth();

    return (
        <div className="p-6">
            <CalendarHeader
                label={cursor.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}
                onPrev={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                onNext={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                onToday={() => setCursor(new Date())}
            />

            <div className="grid grid-cols-7 gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => <div key={d} className="px-1">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
                {days.map((d) => {
                    const dayPosts = posts.filter((p) => sameDay(new Date(p.schedule_at), d));
                    const isToday = sameDay(d, new Date());
                    return (
                        <DayCell
                            key={d.toISOString()}
                            date={d}
                            isToday={isToday}
                            posts={dayPosts}
                            onOpen={onOpen}
                            onDrop={onDrop}
                            minHeight={86}
                            dim={!inMonth(d)}
                            compact
                        />
                    );
                })}
            </div>
        </div>
    );
}

function CalendarHeader({ label, onPrev, onNext, onToday }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">{label}</h3>
            <div className="flex items-center gap-2">
                <button type="button" onClick={onPrev} className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                    <ChevronLeft size={14} />
                </button>
                <button type="button" onClick={onToday} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-gray-200 rounded-lg hover:bg-gray-50">
                    Today
                </button>
                <button type="button" onClick={onNext} className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

function DayCell({ date, posts, isToday, onOpen, onDrop, minHeight, dim, showWeekday, compact }) {
    const [over, setOver] = useState(false);

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                const payload = e.dataTransfer.getData('application/json');
                if (!payload) return;
                try {
                    const post = JSON.parse(payload);
                    // Preserve the original time-of-day; only the date moves.
                    const original = new Date(post.schedule_at);
                    const newDate = new Date(date);
                    newDate.setHours(original.getHours(), original.getMinutes(), 0, 0);
                    onDrop(post, newDate);
                } catch { /* ignore */ }
            }}
            className={`rounded-xl border p-2 transition-colors flex flex-col ${
                isToday ? 'border-gray-900' : 'border-gray-200'
            } ${over ? 'bg-gray-50 border-gray-900' : 'bg-white'} ${dim ? 'opacity-50' : ''}`}
            style={{ minHeight }}
        >
            <div className="flex items-center justify-between mb-1.5">
                {showWeekday && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {date.toLocaleDateString('en-NZ', { weekday: 'short' })}
                    </span>
                )}
                <span className={`text-xs font-bold tabular-nums ${isToday ? 'text-gray-900' : 'text-gray-700'} ${showWeekday ? 'ml-auto' : ''}`}>
                    {date.getDate()}
                </span>
            </div>
            <div className="space-y-1 overflow-hidden">
                {posts.slice(0, compact ? 3 : 6).map((p) => (
                    <DayPostChip key={p.id} post={p} compact={compact} onOpen={onOpen} />
                ))}
                {posts.length > (compact ? 3 : 6) && (
                    <p className="text-[10px] text-gray-500 font-bold">+{posts.length - (compact ? 3 : 6)} more</p>
                )}
            </div>
        </div>
    );
}

function DayPostChip({ post, compact, onOpen }) {
    const meta = SERVICE_BY_ID[post.service];
    return (
        <button
            type="button"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(post))}
            onClick={() => onOpen(post)}
            className={`w-full text-left px-1.5 py-1 rounded-md border flex items-center gap-1 hover:bg-white transition-colors ${meta?.chip || 'bg-gray-50 text-gray-700 border-gray-200'} cursor-grab active:cursor-grabbing`}
            title={post.headline}
        >
            <PlatformIcon id={post.platform} size={10} />
            <span className={`text-[10px] font-semibold truncate ${compact ? 'leading-tight' : ''}`}>
                {post.headline}
            </span>
        </button>
    );
}

function ListView({ posts, onOpen }) {
    const sorted = [...posts].sort((a, b) => new Date(a.schedule_at) - new Date(b.schedule_at));
    return (
        <div className="divide-y divide-gray-100">
            {sorted.map((p) => (
                <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpen(p)}
                    className="w-full text-left flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                    <span className="text-xs font-bold text-gray-900 w-32 tabular-nums">{formatHuman(p.schedule_at)}</span>
                    <ServiceChip service={p.service} />
                    <span className="inline-flex items-center gap-1 text-xs text-gray-700">
                        <PlatformIcon id={p.platform} size={12} />
                        {PLATFORM_BY_ID[p.platform]?.label || p.platform}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-gray-900 truncate">{p.headline}</span>
                    <ChevronRight size={14} className="text-gray-400" />
                </button>
            ))}
        </div>
    );
}

function PostDetailsModal({ post, onClose, onCancel }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className={`relative h-28 ${gradientForService(post.service)} flex items-end p-5`}>
                    <div className="absolute top-4 right-4">
                        <button onClick={onClose} className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-900">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/90 text-gray-900">
                            <PlatformIcon id={post.platform} size={16} />
                        </span>
                        <ServiceChip service={post.service} />
                    </div>
                </div>
                <div className="p-6 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{post.campaign_name}</p>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{post.headline}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                        <CalendarIcon size={13} /> Scheduled for <span className="font-bold text-gray-900">{formatHuman(post.schedule_at)}</span>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-white border border-gray-200 rounded-lg">
                        Close
                    </button>
                    <button onClick={onCancel} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                        <Trash2 size={12} /> Cancel post
                    </button>
                </div>
            </div>
        </div>
    );
}
