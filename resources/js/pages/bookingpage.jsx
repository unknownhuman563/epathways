import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";
import {
    ChevronRight,
    ChevronLeft,
    Calendar,
    CheckCircle
} from "lucide-react";

// Assets
import heroBg from "@assets/Services/education.png";
import dinaImg from "@assets/team/dina.png";
import devImg from "@assets/team/Dev.png";
import daiImg from "@assets/team/dai.png";
import emilyImg from "@assets/team/emily.png";
import emmaImg from "@assets/team/emma.png";

const categories = [
    {
        id: 'education',
        title: 'Education Consultation',
        description: 'Explore study opportunities, university selection, and student visa pathways in NZ.',
        hoverLight: 'group-hover:text-white',
    },
    {
        id: 'immigration',
        title: 'Immigration Consultation',
        description: 'Professional advice on work visas, residency, and professional migration services.',
        hoverLight: 'group-hover:text-white',
    },
    {
        id: 'accommodation',
        title: 'Accommodation Support',
        description: 'Assistance in finding the perfect place to stay during your journey in New Zealand.',
        hoverLight: 'group-hover:text-white',
    }
];

const consultants = {
    education: [
        { id: 1, name: 'Dinah Jabone', role: 'Chief Education Specialist', image: dinaImg },
        { id: 2, name: 'Sarah Wilson', role: 'University Academic Advisor', image: emilyImg }
    ],
    immigration: [
        { id: 3, name: 'Mark Thompson', role: 'Licensed Immigration Adviser', image: devImg },
        { id: 4, name: 'Elena Rodriguez', role: 'Visa Compliance Officer', image: daiImg }
    ],
    accommodation: [
        { id: 5, name: 'Jane Doe', role: 'Housing & Logistics Manager', image: emmaImg }
    ]
};

export default function BookingPage() {
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({
        category: null,
        consultant: null,
        info: {}
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleCategorySelect = (cat) => {
        setSelection(prev => ({ ...prev, category: cat, consultant: null }));
        nextStep();
    };

    const handleConsultantSelect = (con) => {
        setSelection(prev => ({ ...prev, consultant: con }));
        nextStep();
    };

    return (
        <div className="min-h-screen bg-white font-urbanist">
            <Navbar />

            {/* Hero Section - Matching EducationJourney */}
            <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                <img
                    src={heroBg}
                    alt="Book Mural"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>

                <div className="relative z-10 container mx-auto px-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold text-white max-w-5xl mx-auto leading-tight"
                    >
                        Book Your Professional <br />
                        <span className="text-[#436235]">Consultation</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-200 mt-6 text-lg tracking-widest uppercase"
                    >
                        Start your New Zealand Story Today
                    </motion.p>
                </div>
            </section>

            {/* Booking Wizard Section */}
            <section className="py-24 bg-gray-50 min-h-[600px]">
                <div className="container mx-auto px-4 max-w-5xl">

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center mb-16 gap-4 md:gap-8">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 shadow-md ${step >= s ? 'bg-[#436235] text-white' : 'bg-white text-gray-400'
                                    }`}>
                                    {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-10 md:w-20 h-1 mx-2 rounded-full transition-all duration-500 ${step > s ? 'bg-[#436235]' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            {step === 1 && (
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-gray-800 mb-4 uppercase tracking-wider">Choose Service Type</h2>
                                    <p className="text-gray-500 mb-12 max-w-2xl mx-auto">Select the area you'd like to expert guidance in for your New Zealand journey.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat)}
                                                className={`p-10 bg-[#282728] rounded-[20px] transition-all duration-700 hover:bg-[#436235] group text-left flex flex-col items-start relative overflow-hidden shadow-2xl ${selection.category?.id === cat.id ? 'ring-4 ring-[#436235]/30' : ''
                                                    }`}
                                            >
                                                <h3 className="text-2xl font-black text-white mb-4 group-hover:translate-x-1 transition-transform duration-500">{cat.title}</h3>
                                                <p className="text-gray-400 group-hover:text-white/90 text-sm leading-relaxed mb-10 font-medium transition-colors duration-500">{cat.description}</p>

                                                <div className="mt-auto flex items-center text-[#436235] bg-white group-hover:bg-white group-hover:text-[#436235] px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-[0.2em] transition-all duration-500 shadow-lg">
                                                    Choose Service <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <button onClick={prevStep} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <h2 className="text-2xl font-bold text-gray-800">Select Your Consultant</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 max-w-4xl mx-auto">
                                        {consultants[selection.category.id].map((con) => (
                                            <button
                                                key={con.id}
                                                onClick={() => handleConsultantSelect(con)}
                                                className="bg-white p-10 rounded-[24px] border-2 border-transparent hover:border-[#436235] hover:shadow-2xl transition-all duration-500 flex items-center gap-8 group text-left shadow-sm"
                                            >
                                                <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg ring-4 ring-gray-50 group-hover:ring-[#436235]/10 transition-all duration-500 flex-shrink-0">
                                                    <img
                                                        src={con.image}
                                                        alt={con.name}
                                                        className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-800 mb-1">{con.name}</h3>
                                                    <p className="text-[#436235] text-lg font-bold tracking-tight mb-3">{con.role}</p>
                                                    <div className="flex items-center gap-2 text-sm text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-full w-fit">
                                                        <Calendar className="w-4 h-4" /> Available: Mon - Fri
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex items-center gap-4 mb-12">
                                        <button onClick={prevStep} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <h2 className="text-2xl font-bold text-gray-800">Finalize Your Booking</h2>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                        <div className="lg:col-span-2">
                                            <form className="space-y-6">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">First Name</label>
                                                        <input type="text" className="w-full bg-white border-none py-3 px-4 rounded-lg focus:ring-2 focus:ring-[#436235] shadow-sm" placeholder="John" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Last Name</label>
                                                        <input type="text" className="w-full bg-white border-none py-3 px-4 rounded-lg focus:ring-2 focus:ring-[#436235] shadow-sm" placeholder="Doe" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Email Address</label>
                                                    <input type="email" className="w-full bg-white border-none py-3 px-4 rounded-lg focus:ring-2 focus:ring-[#436235] shadow-sm" placeholder="john@example.com" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Additional Message</label>
                                                    <textarea rows="4" className="w-full bg-white border-none py-3 px-4 rounded-lg focus:ring-2 focus:ring-[#436235] shadow-sm" placeholder="Tell us more about your inquiry..."></textarea>
                                                </div>

                                                <div className="pt-6 border-t border-gray-200">
                                                    <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                                        <Calendar className="w-5 h-5 text-[#436235]" /> Schedule with Google Calendar
                                                    </h4>
                                                    <p className="text-gray-500 text-sm mb-6">Clicking below will open {selection.consultant.name}'s calendar where you can choose a convenient time slot.</p>

                                                    <a
                                                        href="https://calendar.google.com"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full bg-[#436235] text-white py-4 rounded-lg font-bold shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 group"
                                                    >
                                                        Book Appointment Time
                                                        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                                    </a>
                                                </div>
                                            </form>
                                        </div>

                                        <div className="bg-white p-8 rounded-3xl shadow-xl h-fit border border-gray-100">
                                            <h3 className="text-xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-50 tracking-wide uppercase">Your Selection</h3>

                                            <div className="space-y-8">
                                                <div className="flex items-start gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Service</p>
                                                        <p className="font-bold text-gray-800 line-clamp-1">{selection.category.title}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                                                        <img
                                                            src={selection.consultant.image}
                                                            alt=""
                                                            className="w-full h-full object-cover object-top"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Consultant</p>
                                                        <p className="font-bold text-gray-800">{selection.consultant.name}</p>
                                                        <p className="text-[10px] text-[#436235] font-medium">{selection.consultant.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            <ScrollToTop />
            <Footer />
        </div>
    );
}
