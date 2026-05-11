import React from 'react';
import { Calendar, Clock, MapPin, Tag, Globe, ArrowRight, Star } from 'lucide-react';

const PublicEventsTable = ({ events }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'TBA';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'ongoing': return 'bg-[#282728] text-white border border-[#282728] shadow-2xl shadow-[#282728]/20';
            case 'upcoming': return 'bg-white text-[#282728] border border-gray-100 shadow-xl';
            default: return 'bg-gray-50 text-gray-500 border border-gray-100';
        }
    };

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-[#282728]/5 shadow-sm">
                <Calendar className="w-16 h-16 mx-auto mb-6 text-gray-200" />
                <h3 className="text-xl font-black text-[#282728] uppercase tracking-tighter mb-2">No Upcoming Events</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Check back later for more activities</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
                <div key={event.id} className="bg-white rounded-[2rem] shadow-[0_16px_32px_-12px_rgba(40,39,40,0.06)] border border-[#282728]/5 overflow-hidden group hover:shadow-[0_32px_64px_-16px_rgba(40,39,40,0.1)] transition-all duration-500 transform hover:-translate-y-2 flex flex-col h-full font-urbanist">
                    {/* Event Banner / Image */}
                    <div className="relative h-[180px] overflow-hidden bg-gray-50 shrink-0 border-b border-gray-100">
                        <img 
                            src={event.banner_image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"} 
                            alt={event.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#282728]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Status Badge */}
                        <div className="absolute top-4 left-4">
                            <div className={`${getStatusStyle(event.status)} px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.3em] flex items-center gap-1.5 backdrop-blur-md`}>
                                <Star size={10} className={status?.toLowerCase() === 'ongoing' ? 'text-white' : 'text-gray-500'} />
                                {event.status}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                        <div className="mb-5 relative z-10">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-2 py-1 bg-gray-50 text-[8px] font-black text-gray-600 rounded uppercase tracking-widest flex items-center gap-1.5 border border-gray-100">
                                    <Tag size={10} /> {event.type || 'Event'}
                                </span>
                                {event.mode && (
                                    <span className="px-2 py-1 bg-gray-50 text-[8px] font-black text-gray-600 rounded uppercase tracking-widest flex items-center gap-1.5 border border-gray-100">
                                        {event.mode === 'online' ? <Globe size={10} /> : <MapPin size={10} />}
                                        {event.mode}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl font-black text-[#282728] uppercase tracking-tighter mb-3 line-clamp-2 leading-tight">
                                {event.name || event.title}
                            </h3>
                            <p className="text-[13px] text-gray-600 font-medium leading-relaxed line-clamp-2">
                                {event.description || "Join us for an insightful session where we explore opportunities and pathways for your future journey."}
                            </p>
                        </div>

                        {/* Details Compact Grid */}
                        <div className="grid grid-cols-3 gap-2 border-y border-gray-50 py-4 mb-6 mt-auto">
                            <div className="flex flex-col text-left">
                                <span className="flex items-center gap-1.5 text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1.5"><Calendar size={10} /> Date</span>
                                <span className="text-[10px] font-bold text-[#282728] uppercase tracking-wider truncate" title={formatDate(event.date_from || event.date)}>{formatDate(event.date_from || event.date)}</span>
                            </div>
                            
                            <div className="flex flex-col text-left px-3 border-x border-gray-50">
                                <span className="flex items-center gap-1.5 text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1.5"><Clock size={10} /> Time</span>
                                <span className="text-[10px] font-bold text-[#282728] uppercase tracking-wider truncate" title={event.time || event.sessions?.[0]?.time_start?.slice(0,5) || 'TBA'}>{event.time || event.sessions?.[0]?.time_start?.slice(0,5) || 'TBA'}</span>
                            </div>

                            <div className="flex flex-col text-left pl-3">
                                <span className="flex items-center gap-1.5 text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1.5"><MapPin size={10} /> Venue</span>
                                <span className="text-[10px] font-bold text-[#282728] uppercase tracking-wider truncate" title={event.mode === 'online' ? 'Online' : (event.location || event.sessions?.[0]?.city || 'TBA')}>{event.mode === 'online' ? 'Online' : (event.location || event.sessions?.[0]?.city || 'TBA')}</span>
                            </div>
                        </div>

                        {/* CTA */}
                        <a 
                            href={event.registration_link || `/register/${event.event_code || event.id}`}
                            className="block w-full py-4 bg-white text-[#282728] border-2 border-gray-100 text-[9px] font-black rounded-xl text-center hover:bg-[#282728] hover:text-white hover:border-[#282728] transition-colors active:scale-95 uppercase tracking-[0.3em] group/btn"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Register Now 
                                <ArrowRight size={12} className="transition-transform group-hover/btn:translate-x-1" />
                            </span>
                        </a>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PublicEventsTable;
