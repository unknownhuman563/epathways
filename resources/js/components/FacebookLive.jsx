import React from 'react';
import { PlayCircle } from 'lucide-react';

const FacebookLive = () => {
    const videos = [
        {
            url: "https://www.facebook.com/share/v/18Kz1swPSF/",
            title: "Live Information Session"
        },
        {
            url: "https://www.facebook.com/share/v/18ZLi6Q1BB/",
            title: "Pathways Discussion & Q&A"
        },
        {
            url: "https://www.facebook.com/share/v/1B5dQCnzDh/",
            title: "Expert Seminar Archive"
        }
    ];

    return (
        <div className="font-urbanist">
            <div className="flex flex-col items-center mb-16 text-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Past Broadcasts</span>
                <h2 className="text-4xl md:text-5xl font-black text-[#282728] uppercase tracking-tighter">Facebook Live</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map((vid, i) => (
                    <div key={i} className="bg-white rounded-[2rem] shadow-[0_16px_32px_-12px_rgba(40,39,40,0.06)] border border-[#282728]/5 overflow-hidden group hover:shadow-[0_32px_64px_-16px_rgba(40,39,40,0.1)] transition-all duration-500 transform hover:-translate-y-2 flex flex-col h-full font-urbanist p-3">
                        {/* Video Embed Container */}
                        <div className="relative aspect-video bg-gray-50 rounded-[1.5rem] overflow-hidden mb-6 flex items-center justify-center border border-gray-100 shrink-0">
                            <iframe 
                                src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(vid.url)}&show_text=false&width=400`}
                                width="400" 
                                height="225" 
                                style={{ border: 'none', overflow: 'hidden' }} 
                                scrolling="no" 
                                frameBorder="0" 
                                allowFullScreen={true} 
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                className="w-full h-full absolute inset-0 max-w-full"
                            ></iframe>
                        </div>

                        {/* Text Block */}
                        <div className="flex-grow flex flex-col px-3 pb-3">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-1 bg-red-50 text-[8px] font-black text-red-600 rounded uppercase tracking-widest flex items-center gap-1.5 border border-red-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 blur-[1px] animate-pulse"></span> Recorded Live
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-black text-[#282728] uppercase tracking-tighter mb-3 line-clamp-1 leading-tight">
                                {vid.title}
                            </h3>
                            
                            <p className="text-[12px] text-gray-400 font-medium leading-relaxed mb-8">
                                Catch up on our latest strategic discussions and interactive segments directly from the official ePathways broadcast.
                            </p>
                            
                            {/* Actions */}
                            <a 
                                href={vid.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto block w-full py-4 bg-gray-50 text-[#282728] border-2 border-transparent text-[9px] font-black rounded-xl text-center hover:bg-[#282728] hover:text-white transition-colors active:scale-95 uppercase tracking-[0.3em] group/btn"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <PlayCircle size={14} className="group-hover/btn:scale-110 transition-transform" /> Watch Replay
                                </span>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FacebookLive;
