import React from 'react';
import { Calendar, MapPin, PlayCircle, ChevronRight } from 'lucide-react';

const FacebookLive = () => {
    const pastSessions = [
        {
            title: "Student life abroad",
            description: "Hear from current students about adjusting to new countries and building community.",
            date: "Sat 03 Feb 2024",
            mode: "Online",
            url: "https://www.facebook.com/share/v/18Kz1swPSF/",
            image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
        },
        {
            title: "Scholarship opportunities",
            description: "Learn how to find and secure funding for your studies with our financial aid experts.",
            date: "Sat 27 Jan 2024",
            mode: "Online",
            url: "https://www.facebook.com/share/v/18ZLi6Q1BB/",
            image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2070&auto=format&fit=crop"
        },
        {
            title: "University selection guide",
            description: "Navigate the choices and find the right institution that matches your goals and interests.",
            date: "Sat 20 Jan 2024",
            mode: "Online",
            url: "https://www.facebook.com/share/v/1B5dQCnzDh/",
            image: "https://images.unsplash.com/photo-1523050335392-93851179ae22?q=80&w=2067&auto=format&fit=crop"
        },
        {
            title: "Visa interview tips",
            description: "Prepare for your visa interview with confidence with these tried and tested techniques.",
            date: "Sat 13 Jan 2024",
            mode: "Online",
            url: "#",
            image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2070&auto=format&fit=crop"
        },
        {
            title: "Pre-departure briefing",
            description: "Everything you need to pack and know before you catch your flight to your study destination.",
            date: "Sat 06 Jan 2024",
            mode: "Online",
            url: "#",
            image: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?q=80&w=2070&auto=format&fit=crop"
        },
        {
            title: "Alumni success stories",
            description: "Get inspired by the journeys of our alumni who are now thriving in their global careers.",
            date: "Sat 30 Dec 2023",
            mode: "Online",
            url: "#",
            image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop"
        }
    ];

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
            <div className="bg-gray-50 rounded-sm overflow-hidden flex flex-col md:flex-row mb-32 border border-gray-100">
                <div className="md:w-1/2 relative aspect-video md:aspect-auto min-h-[300px] bg-gray-200">
                    <img 
                        src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop" 
                        className="w-full h-full object-cover opacity-90"
                        alt="Featured Session"
                    />
                    <span className="absolute top-6 left-6 px-3 py-1 bg-gray-200 text-[10px] font-bold text-gray-600 uppercase rounded-sm">
                        Webinar
                    </span>
                </div>
                <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center items-start">
                    <div className="flex flex-wrap gap-6 mb-8 text-gray-600 text-xs font-medium uppercase tracking-wider">
                        <span className="flex items-center gap-2"><Calendar size={14} /> Sat 10 Feb 2024</span>
                        <span className="flex items-center gap-2"><MapPin size={14} /> Online</span>
                    </div>
                    <h3 className="text-3xl font-medium text-gray-900 mb-8">Immigration pathways discussion</h3>
                    
                    <div className="mb-8">
                        <span className="block text-gray-900 font-bold text-xs uppercase tracking-widest mb-2">Host</span>
                        <p className="text-gray-600 font-light">ePathways team</p>
                    </div>

                    <div className="mb-12">
                        <span className="block text-gray-900 font-bold text-xs uppercase tracking-widest mb-2">Details</span>
                        <p className="text-gray-600 font-light leading-relaxed">
                            Explore visa options and hear from students who have navigated the process successfully. Real questions, honest answers.
                        </p>
                    </div>

                    <button className="px-8 py-3 border border-gray-200 text-gray-900 font-medium hover:bg-white transition-all rounded-sm text-sm">
                        Watch replay
                    </button>
                </div>
            </div>

            {/* Past Sessions Grid */}
            <div>
                <h3 className="text-2xl font-medium text-gray-900 mb-12">Past sessions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {pastSessions.map((session, i) => (
                        <div key={i} className="group cursor-pointer bg-gray-50 rounded-sm overflow-hidden flex flex-col border border-transparent hover:border-gray-100 transition-all">
                            <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                                <img 
                                    src={session.image} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                                    alt={session.title}
                                />
                                <span className="absolute top-4 left-4 px-2 py-1 bg-gray-200 text-[8px] font-bold text-gray-600 uppercase rounded-sm">
                                    Webinar
                                </span>
                            </div>
                            <div className="p-8 flex flex-col items-start flex-grow">
                                <div className="flex flex-wrap gap-4 mb-4 text-gray-600 text-[10px] font-medium uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5"><Calendar size={12} /> {session.date}</span>
                                    <span className="flex items-center gap-1.5"><MapPin size={12} /> {session.mode}</span>
                                </div>
                                <h4 className="text-xl font-medium text-gray-900 mb-4">{session.title}</h4>
                                <p className="text-gray-600 text-sm font-light mb-8 leading-relaxed line-clamp-2">
                                    {session.description}
                                </p>
                                <a 
                                    href={session.url}
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
        </div>
    );
};

export default FacebookLive;
