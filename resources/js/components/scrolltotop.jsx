import { useState, useEffect } from "react";
import { ChevronUp, MessageSquare, X } from "react-feather";
import ChatBot from "./ChatBot";
import { motion, AnimatePresence } from "framer-motion";

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Show button after scrolling down 200px
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 200) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    // Smooth scroll to top
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <>
            {/* Chatbot Window */}
            <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

            {/* Floating Buttons Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                <AnimatePresence>

                </AnimatePresence>

                {/* Chat Trigger Button container */}
                <div className="flex items-center group/chat">
                    <AnimatePresence>
                        {!isChatOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                                transition={{ delay: 0.1 }}
                                className="mr-4 px-5 py-2.5 rounded-full bg-slate-900/60 backdrop-blur-2xl border border-white/10 text-white shadow-[0_10px_40px_-5px_rgba(0,0,0,0.5)] hidden sm:flex items-center gap-2"
                            >
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">
                                    Chat with us!
                                </span>
                                <span className="animate-bounce-slow">🚀</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`relative p-4 rounded-full shadow-[0_15px_35px_-5px_rgba(0,0,0,0.4)] transition-all duration-500 flex items-center justify-center overflow-visible ${
                            isChatOpen 
                                ? 'bg-[#111111] rotate-90 border border-white/10' 
                                : 'bg-[#436235] hover:shadow-[0_0_30px_rgba(67,98,53,0.4)] hover:scale-110 active:scale-95'
                        }`}
                    >

                        
                        {isChatOpen ? (
                            <X size={22} className="text-white" />
                        ) : (
                            <MessageSquare size={22} className="text-white" />
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ScrollToTop;
