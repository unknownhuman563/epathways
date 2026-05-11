import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, User, Bot, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';

const ChatBot = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your ePathways assistant. How can I help you navigate your New Zealand journey today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/chat', {
                message: input,
                history: messages.slice(1) // Send history excluding the initial welcome
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response.data.message }]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg = error.response?.data?.error || 'I apologize, but I am having trouble connecting right now. Please try again or book a consultation if you need immediate help.';
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: errorMsg 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickActions = [
        { label: 'Start Assessment', link: 'https://forms.clickup.com/9003110473/f/8ca1429-27476/ZFL0N95I6L0K6QEPTD' },
        { label: 'Book Consultation', link: '/booking' },
        { label: 'Explore Programs', link: '/programs' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30, transformOrigin: 'bottom right' }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-24 right-4 md:right-6 w-[350px] md:w-[420px] h-[600px] bg-white rounded-[2rem] shadow-[0_25px_80px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden z-[60] border border-slate-200 font-urbanist"
                >
                    {/* Header: Dark Gray Premium */}
                    <div className="bg-slate-900 p-5 flex items-center justify-between relative overflow-hidden group">
                        {/* Subtle background glow */}
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#436235]/20 blur-[50px] rounded-full group-hover:bg-[#436235]/30 transition-all duration-700"></div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="relative">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#436235] to-[#2d4224] flex items-center justify-center text-white shadow-lg border border-white/20">
                                    <Bot size={22} strokeWidth={1.5} />
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900 animate-pulse"></span>
                            </div>
                            <div>
                                <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">ePathways Assistant</h3>
                                <p className="text-[10px] text-white/40 font-medium tracking-wider">Expert Consultant</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-white/30 hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area: White Background */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none bg-white">
                        {messages.map((msg, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                key={idx} 
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`p-4 rounded-3xl text-[13px] leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-[#436235] text-white rounded-tr-none shadow-[0_8px_16px_rgba(67,98,53,0.2)]' 
                                            : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        
                        {isLoading && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <div className="bg-slate-100 p-4 rounded-3xl rounded-tl-none border border-slate-200 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="px-6 pb-2 bg-white">
                        {messages.length === 1 && !isLoading && (
                            <div className="flex flex-wrap gap-2">
                                {quickActions.map((action, i) => (
                                    <motion.a 
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 + (i * 0.1) }}
                                        whileHover={{ scale: 1.05, backgroundColor: "rgba(0, 0, 0, 0.05)" }}
                                        href={action.link}
                                        target={action.link.startsWith('http') ? '_blank' : '_self'}
                                        className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-4 py-2 rounded-full font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                                    >
                                        {action.label} <ArrowRight size={12} className="opacity-40" />
                                    </motion.a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Input Field: White/Gray Minimalist */}
                    <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100">
                        <div className="relative group/input flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Pave your path..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-sm text-slate-800 focus:outline-none focus:border-[#436235]/40 focus:bg-white transition-all placeholder:text-slate-400 shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 w-10 h-10 rounded-xl bg-[#436235] flex items-center justify-center text-white disabled:opacity-20 disabled:grayscale transition-all hover:shadow-[0_4px_12px_rgba(67,98,53,0.3)] active:scale-90"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <p className="text-center text-[9px] text-slate-300 uppercase tracking-[0.3em] mt-4 font-bold">Powered by ePathways AI</p>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatBot;
