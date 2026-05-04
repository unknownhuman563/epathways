import React from 'react';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop';

const formatSessionDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};

const FacebookLive = ({ pastSessions = [], featuredSession = null }) => {
    return (
        <div className="font-urbanist max-w-7xl mx-auto px-6">
            {/* Header Section */}
            <div className="flex flex-col items-start mb-16">
                <span className="text-gray-900 text-sm font-bold tracking-wider mb-4 uppercase">
                    Weekly
                </span>
                <h2 className="text-5xl font-medium text-gray-900 mb-6 tracking-tight">
                    Saturday live sessions
                </h2>
                <p className="text-gray-600 text-lg font-light">
                    Join us every Saturday for candid conversations about studying and living abroad.
                </p>
            </div>

            {/* Featured Session Card */}
            {featuredSession && (
                <div className="bg-gray-50 rounded-sm overflow-hidden flex flex-col md:flex-row mb-32 border border-gray-100">
                    <div className="md:w-1/2 relative aspect-video md:aspect-auto min-h-[300px] bg-gray-200">
                        <img
                            src={featuredSession.image_url || FALLBACK_IMAGE}
                            className="w-full h-full object-cover opacity-90"
                            alt={featuredSession.title}
                        />
                        <span className="absolute top-6 left-6 px-3 py-1 bg-gray-200 text-[10px] font-bold text-gray-600 uppercase rounded-sm">
                            Webinar
                        </span>
                    </div>
                    <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center items-start">
                        <div className="flex flex-wrap gap-6 mb-8 text-gray-500 text-xs font-medium uppercase tracking-wider">
                            <span className="flex items-center gap-2"><Calendar size={14} /> {formatSessionDate(featuredSession.session_date)}</span>
                            <span className="flex items-center gap-2"><MapPin size={14} /> Online</span>
                        </div>
                        <h3 className="text-3xl font-medium text-gray-900 mb-8">{featuredSession.title}</h3>

                        <div className="mb-8">
                            <span className="block text-gray-900 font-bold text-xs uppercase tracking-widest mb-2">Host</span>
                            <p className="text-gray-600 font-light">ePathways team</p>
                        </div>

                        <div className="mb-12">
                            <span className="block text-gray-900 font-bold text-xs uppercase tracking-widest mb-2">Details</span>
                            <p className="text-gray-600 font-light leading-relaxed">
                                {featuredSession.description}
                            </p>
                        </div>

                        <a
                            href={featuredSession.fb_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-3 border border-gray-200 text-gray-900 font-medium hover:bg-white transition-all rounded-sm text-sm"
                        >
                            Watch replay
                        </a>
                    </div>
                </div>
            )}

            {/* Past Sessions Grid */}
            {pastSessions.length > 0 && (
                <div>
                    <h3 className="text-2xl font-medium text-gray-900 mb-12">Past sessions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {pastSessions.map((session) => (
                            <div key={session.id} className="group cursor-pointer bg-gray-50 rounded-sm overflow-hidden flex flex-col border border-transparent hover:border-gray-100 transition-all">
                                <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                                    <img
                                        src={session.image_url || FALLBACK_IMAGE}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                                        alt={session.title}
                                    />
                                    <span className="absolute top-4 left-4 px-2 py-1 bg-gray-200 text-[8px] font-bold text-gray-600 uppercase rounded-sm">
                                        Webinar
                                    </span>
                                </div>
                                <div className="p-8 flex flex-col items-start flex-grow">
                                    <div className="flex flex-wrap gap-4 mb-4 text-gray-500 text-[10px] font-medium uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatSessionDate(session.session_date)}</span>
                                        <span className="flex items-center gap-1.5"><MapPin size={12} /> Online</span>
                                    </div>
                                    <h4 className="text-xl font-medium text-gray-900 mb-4">{session.title}</h4>
                                    <p className="text-gray-500 text-sm font-light mb-8 leading-relaxed line-clamp-2">
                                        {session.description}
                                    </p>
                                    <a
                                        href={session.fb_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-auto text-gray-900 font-medium text-sm flex items-center gap-2 group/btn"
                                    >
                                        Watch now <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacebookLive;
