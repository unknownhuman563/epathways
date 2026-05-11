import React from 'react';
import { Head } from '@inertiajs/react';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";
// Announcements removed per minimalist redesign
import FacebookLive from "@/components/FacebookLive";

// Import Logo for Backdrop
import LogoBackdrop from "@assets/newlogosite.png";

const formatEventDate = (dateStr) => {
    if (!dateStr) return { day: 'TBA', date: '', monthYear: '' };
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return { day, date: dayNum, monthYear };
};

export default function Activities({ events, pastSessions = [], featuredSession = null }) {
    return (
        <div className="min-h-screen bg-white font-urbanist overflow-x-hidden">
            <Head title="Activities - Events, Announcements & Live" />
            <Navbar />

            {/* HERO SECTION - Premium Dark Left Aligned */}
            <div className="relative pt-48 pb-32 overflow-hidden flex flex-col items-start justify-center min-h-[70vh]">
                {/* Background Video */}
                <div className="absolute inset-0 z-0">
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src="https://player.vimeo.com/external/494252666.sd.mp4?s=bc46c6a4701d8487b28292c69c67675e&profile_id=139&oauth2_token_id=57447761" type="video/mp4" />
                    </video>
                    {/* Official Dark Gray Overlay */}
                    <div className="absolute inset-0 bg-[#1a1a1a]/80 mix-blend-multiply z-0"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#1a1a1a]/60 to-transparent z-0"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                    <div className="flex flex-col items-start max-w-4xl">
                        <span className="text-white text-sm font-bold tracking-[0.2em] mb-4 uppercase">
                            EXPLORE
                        </span>
                        
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium text-white leading-[1.1] mb-8 tracking-tight">
                            Activities and events
                        </h1>
                        
                        <p className="text-lg md:text-xl text-gray-300 font-light mb-10 max-w-lg leading-relaxed">
                            Engage. Connect. Grow. Explore our diverse range of student and community programs.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button className="px-8 py-4 bg-[#436235] hover:bg-[#436235]/90 text-white font-semibold rounded transition-all duration-300 shadow-lg hover:shadow-[#436235]/20">
                                Register
                            </button>
                            <button className="px-8 py-4 border border-white/30 hover:border-white text-white font-semibold rounded transition-all duration-300 backdrop-blur-sm hover:bg-white/5">
                                Learn more
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* DISCOVER SECTION - Premium Dark Grid */}
            <section className="bg-[#0a0f0a] py-32 text-center overflow-hidden">
                <div className="container mx-auto px-6 max-w-7xl">
                    <span className="text-white text-sm font-bold tracking-[0.2em] mb-4 uppercase inline-block">
                        Discover
                    </span>
                    
                    <h2 className="text-4xl md:text-5xl font-medium text-white mb-8 tracking-tight">
                        Three ways to connect with us
                    </h2>
                    
                    <p className="text-gray-500 text-lg max-w-5xl mx-auto mb-20 leading-relaxed font-light">
                        From live sessions on social media to interactive webinars and local community gatherings, 
                        we provide multiple platforms for you to learn, grow, and network.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
                        {/* Facebook Live Card */}
                        <div className="group cursor-pointer">
                            <div className="aspect-[16/10] overflow-hidden rounded-sm mb-8 bg-gray-900 border border-white/5 transition-all duration-500 group-hover:border-white/20">
                                <img 
                                    src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop" 
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                                    alt="Facebook Live"
                                />
                            </div>
                            <h3 className="text-2xl font-medium text-white mb-4">Facebook Live</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Join our weekly live sessions for real-time updates and direct Q&A with our migration experts.
                            </p>
                        </div>

                        {/* Webinars Card */}
                        <div className="group cursor-pointer">
                            <div className="aspect-[16/10] overflow-hidden rounded-sm mb-8 bg-gray-900 border border-white/5 transition-all duration-500 group-hover:border-white/20">
                                <img 
                                    src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=1974&auto=format&fit=crop" 
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                                    alt="Webinars"
                                />
                            </div>
                            <h3 className="text-2xl font-medium text-white mb-4">Webinars</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Dive deep into specific educational paths and visa processes through our structured online seminars.
                            </p>
                        </div>

                        {/* Community Card */}
                        <div className="group cursor-pointer">
                            <div className="aspect-[16/10] overflow-hidden rounded-sm mb-8 bg-gray-900 border border-white/5 transition-all duration-500 group-hover:border-white/20">
                                <img 
                                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop" 
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                                    alt="Community Events"
                                />
                            </div>
                            <h3 className="text-2xl font-medium text-white mb-4">Community Events</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Meet us in person at our local workshops and networking events designed to build lasting connections.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-8">
                        <button className="px-10 py-3 border border-white/10 text-white font-medium hover:bg-white/5 transition-all">
                            Explore
                        </button>
                        <button className="text-white font-medium flex items-center gap-2 hover:gap-3 transition-all">
                            Learn <span className="text-lg">›</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* UPCOMING EVENTS SECTION - Clean White */}
            <section id="events" className="py-32 bg-white">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div className="max-w-2xl">
                            <span className="text-gray-900 text-sm font-bold tracking-wider mb-4 uppercase inline-block">
                                Upcoming
                            </span>
                            <h2 className="text-5xl font-medium text-gray-900 mb-6 tracking-tight">
                                Events
                            </h2>
                            <p className="text-gray-600 text-lg font-light">
                                Register for programs happening this month and connect with our community.
                            </p>
                        </div>
                        <button className="px-6 py-2 border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-all rounded-sm self-start md:self-auto">
                            View all
                        </button>
                    </div>

                    <div className="flex overflow-x-auto gap-8 pb-12 scrollbar-hide snap-x">
                        {events && events.length > 0 ? (
                            events.map((event) => {
                                const { day, date, monthYear } = formatEventDate(event.date_from || event.date);
                                return (
                                    <div key={event.id} className="group cursor-pointer bg-gray-50 rounded-sm overflow-hidden flex flex-col min-w-[350px] md:min-w-[500px] snap-start">
                                        <div className="relative aspect-[16/9] bg-gray-200 overflow-hidden">
                                            <img 
                                                src={event.banner_image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                                                alt={event.name || event.title}
                                            />
                                            {/* Date Badge */}
                                            <div className="absolute top-0 right-0 m-4 bg-white/90 backdrop-blur-md px-4 py-3 text-center min-w-[80px] shadow-sm">
                                                <span className="block text-[10px] text-gray-600 uppercase font-bold">{day}</span>
                                                <span className="block text-2xl font-medium text-gray-900">{date}</span>
                                                <span className="block text-[10px] text-gray-600 uppercase font-bold">{monthYear}</span>
                                            </div>
                                        </div>
                                        <div className="p-8 md:p-10 flex flex-col items-start flex-grow">
                                            <div className="flex mb-6">
                                                <span className="px-3 py-1 bg-gray-200 text-[10px] font-bold text-gray-600 uppercase rounded-sm">
                                                    {event.type || 'Event'}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-medium text-gray-900 mb-2 line-clamp-1">{event.name || event.title}</h3>
                                            <p className="text-sm text-gray-600 mb-6 uppercase tracking-wider">
                                                {event.mode === 'online' ? 'Online' : (event.location || event.sessions?.[0]?.city || 'TBA')}
                                            </p>
                                            <p className="text-gray-600 font-light mb-8 leading-relaxed line-clamp-2">
                                                {event.description || "Join us for an insightful session where we explore opportunities and pathways for your future journey."}
                                            </p>
                                            <a 
                                                href={event.registration_link || `/register/${event.event_code || event.id}`}
                                                className="text-gray-900 font-medium flex items-center gap-2 group/btn mt-auto"
                                            >
                                                Register <span className="group-hover/btn:translate-x-1 transition-transform">›</span>
                                            </a>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full py-20 text-center text-gray-600">
                                No upcoming events found. Please check back later.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Facebook Live Section */}
            <section id="facebook-live" className="py-24 bg-white border-t border-gray-50">
                <div className="container mx-auto px-4 max-w-7xl">
                    <FacebookLive pastSessions={pastSessions} featuredSession={featuredSession} />
                </div>
            </section>

            {/* MOMENTS SECTION - Light Gray Gallery */}
            <section className="bg-gray-100 py-32 text-center overflow-hidden">
                <div className="container mx-auto px-6 max-w-7xl">
                    <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 tracking-tight">
                        Moments from our community
                    </h2>
                    <p className="text-gray-600 text-lg font-light mb-16 max-w-4xl mx-auto">
                        See the connections made, skills gained, and memories created at ePathways events.
                    </p>

                    <div className="relative group">
                        <div className="flex overflow-x-auto gap-6 scrollbar-hide snap-x pb-12">
                            {[
                                "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2064&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                            ].map((img, i) => (
                                <div key={i} className="min-w-[300px] md:min-w-[400px] aspect-square rounded-sm overflow-hidden bg-gray-200 snap-center shadow-sm">
                                    <img src={img} className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700" alt={`Community moment ${i+1}`} />
                                </div>
                            ))}
                        </div>
                        {/* Custom Dots Navigation */}
                        <div className="flex justify-center gap-2 mt-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-gray-900' : 'bg-gray-300'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION - Ready to take the next step (Dark Gray) */}
            <section className="bg-[#1a1a1a] py-32 text-center">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h2 className="text-4xl md:text-5xl font-medium text-white mb-8 tracking-tight">
                        Ready to take the next step
                    </h2>
                    <p className="text-gray-500 text-lg font-light mb-12">
                        Sign up for an upcoming activity and start building your network with us today.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button className="px-10 py-4 bg-[#436235] hover:bg-[#436235]/90 text-white font-medium rounded-sm transition-all shadow-lg hover:shadow-[#436235]/20">
                            Register now
                        </button>
                        <button className="px-10 py-4 border border-white/20 text-white font-medium hover:bg-white/5 transition-all rounded-sm">
                            View calendar
                        </button>
                    </div>
                </div>
            </section>

            <ScrollToTop />
            <Footer />
        </div>
    );
}
