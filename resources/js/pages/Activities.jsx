import React from 'react';
import { Head } from '@inertiajs/react';
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";
// Announcements removed per minimalist redesign
import PublicEventsTable from "@/components/PublicEventsTable";
import FacebookLive from "@/components/FacebookLive";

// Import Logo for Backdrop
import LogoBackdrop from "@assets/newlogosite.png";

export default function Activities({ events }) {
    return (
        <div className="min-h-screen bg-white font-urbanist overflow-x-hidden">
            <Head title="Activities - Events, Announcements & Live" />
            <Navbar />

            {/* HERO SECTION - Premium Dark */}
            <div className="relative pt-40 pb-32 overflow-hidden flex flex-col items-center justify-center text-center">
                {/* Background Image generic */}
                <img 
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop" 
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    alt="Activities Hero"
                />
                <div className="absolute inset-0 bg-black/60 z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#282728] via-[#282728]/80 to-transparent z-0"></div>

                <div className="container mx-auto px-6 relative z-10 max-w-4xl flex flex-col items-center">
                    <div className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-[0.4em] mb-8">
                        Our Community
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl lg:text-[7rem] lg:leading-[0.9] font-black text-white uppercase tracking-tighter leading-[1] mb-8 drop-shadow-2xl">
                        Activities & <br/><span className="text-gray-400">Events</span>
                    </h1>
                    
                    <p className="text-sm md:text-base text-gray-300 font-bold uppercase tracking-widest max-w-xl mx-auto drop-shadow-md">
                        Discover the latest happenings, webinars, and live updates.
                    </p>
                </div>
            </div>

            {/* Events List Section */}
            <section id="events" className="py-24 bg-gray-50/40">
                <div className="container mx-auto px-6 max-w-[1200px]">
                    <div className="flex flex-col items-center mb-16 text-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Official Schedule</span>
                        <h2 className="text-4xl font-black text-[#282728] uppercase tracking-tighter">Upcoming Events</h2>
                    </div>
                    <PublicEventsTable events={events} />
                </div>
            </section>

            {/* Facebook Live Section */}
            <section id="facebook-live" className="py-24 bg-white">
                <div className="container mx-auto px-4 max-w-7xl">
                    <FacebookLive />
                </div>
            </section>

            <ScrollToTop />
            <Footer />
        </div>
    );
}
