import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/navigation-bar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scrolltotop";
import {
    ChevronRight,
    ChevronLeft,
    Calendar,
    CheckCircle,
    GraduationCap,
    Globe,
    Home,
    Phone,
    Mail,
    Clock,
    Plus,
    MessageSquare,
    BookOpen
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
        description: 'Expert guidance on choosing the right NZ institution, course, and pathway to match your academic background and career goals.',
        features: [
            'University & polytechnic selection',
            'Student visa application support',
            'English language pathway planning',
            'Scholarship & funding guidance'
        ],
        price: 'NZD $150',
        icon: GraduationCap,
        label: 'EDUCATION'
    },
    {
        id: 'immigration',
        title: 'Immigration Consultation',
        description: 'Licensed immigration advice covering all major NZ visa categories — from skilled migrant to family reunification and work-to-residency pathways.',
        features: [
            'Work visa & essential skills',
            'Skilled migrant category (SMC)',
            'Partner & family visas',
            'Residency application support'
        ],
        price: 'NZD $200',
        icon: Globe,
        label: 'IMMIGRATION'
    },
    {
        id: 'accommodation',
        title: 'Accommodation Support',
        description: 'We help you find safe, comfortable, and affordable housing in New Zealand — whether you\'re a student, worker, or new resident.',
        features: [
            'Homestay placement & matching',
            'Student hostel & dorm options',
            'Private rental search assistance',
            'Tenancy rights & contract review'
        ],
        price: 'NZD $100',
        icon: Home,
        label: 'ACCOMMODATION'
    }
];

const faqs = [
    {
        question: "Do I need to be in New Zealand to book a consultation?",
        answer: "No, we offer online consultations via Zoom, Google Meet, or WhatsApp for clients anywhere in the world."
    },
    {
        question: "What's the difference between an education and immigration consultation?",
        answer: "Education focus on course selection and student visas, while immigration covers work, residency, and professional migration pathways."
    },
    {
        question: "How long does the visa application process take?",
        answer: "Processing times vary significantly by visa type and individual circumstances. We'll provide current estimates during your session."
    },
    {
        question: "Are your advisors licensed by the NZ government?",
        answer: "Yes, our immigration advice is provided by Licensed Immigration Advisers (LIA) as required by NZ law."
    },
    {
        question: "Can you help with accommodation even if I'm already in NZ?",
        answer: "Absolutely! We assist both offshore and onshore clients with finding suitable housing and understanding tenancy agreements."
    }
];

const consultants = {
    education: [
        {
            id: 1,
            name: 'Dinah Jabone',
            role: 'Chief Education Specialist',
            image: dinaImg,
            bio: "Dinah brings 8 years of hands-on experience helping international students navigate New Zealand's tertiary education system. She has placed over 300 students in top NZ universities and polytechnics, and specialises in tailoring pathways for students from Southeast Asia and the Pacific.",
            tags: ['IAA LICENSED', '8 YRS EXP', 'EN · FIL'],
            status: 'available',
            availability: 'Mon – Fri, 9am – 5pm NZST',
            sessionLength: '60 min, Video or Phone',
            sessionFormat: 'Video Call or Phone',
            institutions: 'UoA, AUT, Massey +14 more',
            specialisesIn: ['University Admissions', 'Student Visa', 'Scholarship Guidance', 'English Pathways', 'Course Matching'],
            bookingUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0A25brqHYLx6o-iqanRiIG-jugrE62FGo4ryI_dQyPsPl8N1m3dr1VcP5rla8l8b-n3SEBy8r4?gv=true'
        },
        {
            id: 2,
            name: 'Emily',
            role: 'University Academic Advisor',
            image: emilyImg,
            bio: "Sarah is a former academic at the University of Auckland with over 12 years in tertiary education advising. She specialises in postgraduate pathways, research programmes, and helping professionals transition into NZ academic institutions from China and East Asia.",
            tags: ['IAA LICENSED', '12 YRS EXP', 'EN · ZH'],
            status: 'available',
            availability: 'Mon – Fri, 10am – 6pm NZST',
            sessionLength: '60 – 90 min, Video or Phone',
            sessionFormat: 'Video Call or Phone',
            institutions: 'UoA, Victoria, Otago +20 more',
            specialisesIn: ['Postgraduate Pathways', 'Research Programmes', 'Academic Transfers', 'PhD Applications', 'Work-Study Visas'],
            bookingUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0A25brqHYLx6o-iqanRiIG-jugrE62FGo4ryI_dQyPsPl8N1m3dr1VcP5rla8l8b-n3SEBy8r4?gv=true'
        }
    ],
    immigration: [
        {
            id: 3,
            name: 'Mark Thompson',
            role: 'Licensed Immigration Adviser',
            image: devImg,
            bio: "Mark is a senior advisor with extensive experience in NZ work and residency visas. He specialises in skilled migration and employer-assisted visa categories.",
            tags: ['IAA LICENSED', '10 YRS EXP', 'EN'],
            status: 'available',
            availability: 'Mon – Fri, 9am – 5pm NZST',
            sessionLength: '45 – 60 min, Video',
            sessionFormat: 'Video Call',
            institutions: 'All Major Districts',
            specialisesIn: ['Skilled Migrant', 'Work Visas', 'Residency', 'Employer Accreditation'],
            bookingUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0A25brqHYLx6o-iqanRiIG-jugrE62FGo4ryI_dQyPsPl8N1m3dr1VcP5rla8l8b-n3SEBy8r4?gv=true'
        },
        {
            id: 4,
            name: 'Elena Rodriguez',
            role: 'Visa Compliance Officer',
            image: daiImg,
            bio: "Elena specializes in partner and family visa categories, ensuring all documentation meets rigorous NZ immigration standards for high approval rates.",
            tags: ['IAA LICENSED', '7 YRS EXP', 'EN · ES'],
            status: 'available',
            availability: 'Mon – Thu, 9am – 4pm NZST',
            sessionLength: '60 min, Call',
            sessionFormat: 'Video Call or Phone',
            institutions: 'All Major Districts',
            specialisesIn: ['Partner Visas', 'Family Visas', 'Compliance', 'Appeals'],
            bookingUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0A25brqHYLx6o-iqanRiIG-jugrE62FGo4ryI_dQyPsPl8N1m3dr1VcP5rla8l8b-n3SEBy8r4?gv=true'
        }
    ],
    accommodation: [
        {
            id: 5,
            name: 'Jane Doe',
            role: 'Housing & Logistics Manager',
            image: emmaImg,
            bio: "Jane provides comprehensive support for settling in NZ, from finding the perfect homestay to navigating the rental market in major NZ cities.",
            tags: ['HOUSING SPEC', '5 YRS EXP', 'EN'],
            status: 'available',
            availability: 'Mon – Fri, 8am – 4pm NZST',
            sessionLength: '30 – 45 min, Video',
            sessionFormat: 'Video Call or Phone',
            institutions: 'Nationwide Support',
            specialisesIn: ['Homestays', 'Rental Markets', 'Settling In', 'Student Accommodation'],
            bookingUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0A25brqHYLx6o-iqanRiIG-jugrE62FGo4ryI_dQyPsPl8N1m3dr1VcP5rla8l8b-n3SEBy8r4?gv=true'
        }
    ]
};

export default function BookingPage() {
    const [step, setStep] = useState(1);
    const [openFaq, setOpenFaq] = useState(null);
    const [selection, setSelection] = useState({
        category: null,
        consultant: null,
        info: {
            firstName: '',
            lastName: '',
            email: '',
            currentCountry: '',
            message: ''
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [error, setError] = useState(null);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSelection(prev => ({
            ...prev,
            info: { ...prev.info, [name]: value }
        }));
    };

    const handleBookingSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({
                    first_name: selection.info.firstName,
                    last_name: selection.info.lastName,
                    email: selection.info.email,
                    current_country: selection.info.currentCountry,
                    service_type: selection.category.title,
                    consultant_name: selection.consultant.name,
                    message: selection.info.message,
                    platform: 'Google Calendar'
                })
            });

            if (response.ok) {
                setBookingSuccess(true);
            } else {
                const data = await response.json();
                setError(data.message || "Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Booking failed:", error);
            setError("Network error. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F8F6] font-urbanist">
            <Navbar />

            {/* Hero Section - Matching EducationJourney */}
            <section className="relative h-[40vh] min-h-[350px] flex items-center justify-center overflow-hidden">
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
                        className="text-4xl md:text-6xl font-bold text-white max-w-5xl mx-auto leading-tight"
                    >
                        Book Your Professional <br />
                        <span className="text-[#436235]">Consultation</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-200 mt-6 text-sm tracking-widest uppercase font-semibold"
                    >
                        Start your New Zealand Story Today
                    </motion.p>
                </div>
            </section>

            {/* Booking Wizard Section */}
            <section className="py-20">
                <div className="container mx-auto px-4 max-w-7xl">

                    {/* Step Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {step === 1 && (
                                <div>
                                    <div className="mb-12">
                                        <h2 className="text-4xl md:text-5xl font-black text-[#282728] mb-4">Choose your <br />service type</h2>
                                        <p className="text-gray-500 max-w-lg leading-relaxed">
                                            Select the area you need guidance in — each service is delivered by a specialist in that field.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                                        {categories.map((cat) => (
                                            <div
                                                key={cat.id}
                                                className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 flex flex-col h-full relative group transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                                            >
                                                {/* Icon */}
                                                <div className="mb-8">
                                                    <div className="w-12 h-12 bg-[#282728] rounded-xl flex items-center justify-center text-white">
                                                        <cat.icon size={24} />
                                                    </div>
                                                </div>

                                                {/* Label & Title */}
                                                <div className="mb-6">
                                                    <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">{cat.label}</span>
                                                    <h3 className="text-2xl font-black text-[#282728] mt-2 leading-tight">
                                                        {cat.title.split(' ')[0]} <br /> {cat.title.split(' ')[1]}
                                                    </h3>
                                                </div>

                                                {/* Description */}
                                                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                                                    {cat.description}
                                                </p>

                                                {/* Features */}
                                                <ul className="space-y-3 mb-10 flex-grow">
                                                    {cat.features.map((feature, idx) => (
                                                        <li key={idx} className="flex items-start gap-3 text-gray-500 text-sm">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#436235] mt-1.5 flex-shrink-0" />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>

                                                {/* Footer */}
                                                <div className="pt-6 border-t border-gray-50 flex items-center justify-end mt-auto">
                                                    <button
                                                        onClick={() => handleCategorySelect(cat)}
                                                        className="flex items-center gap-2 bg-[#282728] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:bg-[#436235] hover:scale-105"
                                                    >
                                                        Choose <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* FAQ and Contact Section */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-32 pt-16 border-t border-gray-200">
                                        {/* FAQ Header & Contact Card */}
                                        <div className="space-y-12">
                                            <div>
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-8 h-[2px] bg-[#436235]" />
                                                    <span className="text-xs font-bold tracking-[0.3em] text-[#436235] uppercase">FAQ</span>
                                                </div>
                                                <h2 className="text-4xl font-black text-[#282728] mb-6">Common <br />questions</h2>
                                                <p className="text-gray-500 max-w-sm leading-relaxed">
                                                    Can't find an answer? Reach out and we'll get back to you within 3 hours.
                                                </p>
                                            </div>

                                            <div className="bg-[#282728] rounded-[24px] p-7 text-white relative overflow-hidden group shadow-xl max-w-sm">
                                                <div className="relative z-10">
                                                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#436235] uppercase mb-3 block">GET IN TOUCH</span>
                                                    <h3 className="text-xl font-black mb-6 leading-tight pr-10">Speak directly with <br />an advisor today</h3>

                                                    <div className="space-y-4">
                                                        <a href="tel:+6491234567" className="flex items-center gap-3 group/item hover:text-[#436235] transition-colors duration-300">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover/item:text-[#436235] group-hover/item:bg-[#436235]/10">
                                                                <Phone size={16} />
                                                            </div>
                                                            <span className="font-bold text-sm text-gray-200">+64 9 123 4567</span>
                                                        </a>
                                                        <a href="mailto:hello@epathways.co.nz" className="flex items-center gap-3 group/item hover:text-[#436235] transition-colors duration-300">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover/item:text-[#436235] group-hover/item:bg-[#436235]/10">
                                                                <Mail size={16} />
                                                            </div>
                                                            <span className="font-bold text-sm text-gray-200">hello@epathways.co.nz</span>
                                                        </a>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                                                <Clock size={16} />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-sm text-gray-200 block">Mon–Fri, 9am – 6pm</span>
                                                                <span className="text-[10px] text-gray-500 font-bold tracking-wider">NZST</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Decorative element */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#436235]/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                                            </div>
                                        </div>

                                        {/* FAQ Accordion */}
                                        <div className="space-y-2">
                                            {faqs.map((faq, idx) => (
                                                <div key={idx} className="border-b border-gray-200">
                                                    <button
                                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                                        className="w-full py-8 flex items-center justify-between text-left group"
                                                    >
                                                        <span className={`text-lg font-bold transition-all duration-300 ${openFaq === idx ? 'text-[#436235]' : 'text-[#282728] group-hover:pl-2'}`}>
                                                            {faq.question}
                                                        </span>
                                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${openFaq === idx ? 'bg-[#436235] border-[#436235] text-white rotate-45' : 'border-gray-200 text-gray-400 group-hover:border-[#436235] group-hover:text-[#436235]'}`}>
                                                            <Plus className="w-5 h-5" />
                                                        </div>
                                                    </button>
                                                    <AnimatePresence>
                                                        {openFaq === idx && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.3 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <p className="pb-8 text-gray-500 leading-relaxed max-w-lg">
                                                                    {faq.answer}
                                                                </p>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div>
                                    <div className="flex items-center gap-4 mb-12">
                                        <button onClick={prevStep} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <div>
                                            <h2 className="text-3xl font-black text-[#282728]">Select your consultant</h2>
                                            <p className="text-gray-500 text-sm mt-1">Choose the expert who will guide you on your journey.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                                        {selection.category && consultants[selection.category.id]?.map((con) => (
                                            <div
                                                key={con.id}
                                                className={`bg-white rounded-[32px] overflow-hidden border-2 transition-all duration-500 flex flex-col ${selection.consultant?.id === con.id ? 'border-[#436235] ring-4 ring-[#436235]/5 shadow-2xl' : 'border-transparent shadow-sm hover:shadow-xl'
                                                    }`}
                                            >
                                                {/* Header Info */}
                                                <div className="p-8 pb-0">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="relative">
                                                            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md ring-1 ring-gray-100">
                                                                <img
                                                                    src={con.image}
                                                                    alt={con.name}
                                                                    className="w-full h-full object-cover object-top"
                                                                />
                                                            </div>
                                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white ${con.status === 'available' ? 'bg-green-500' : 'bg-orange-500'
                                                                }`} />
                                                        </div>
                                                        {selection.consultant?.id === con.id && (
                                                            <div className="bg-[#436235] text-white p-1.5 rounded-full">
                                                                <CheckCircle size={18} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mb-6">
                                                        <h3 className="text-2xl font-black text-[#282728] leading-tight">{con.name}</h3>
                                                        <p className="text-[#436235] font-bold text-sm tracking-wide mt-1">{con.role}</p>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-8">
                                                        {con.tags.map((tag, i) => (
                                                            <span key={i} className="bg-gray-50 text-gray-500 text-[10px] font-bold px-3 py-1.5 rounded-lg tracking-wider border border-gray-100">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-4">
                                                        {con.bio}
                                                    </p>

                                                    <div className="h-[1px] bg-gray-50 w-full mb-8" />

                                                    {/* Session Details Grid */}
                                                    <div className="grid grid-cols-2 gap-y-8 gap-x-4 mb-8">
                                                        <div className="flex gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                                <Calendar size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">AVAILABILITY</p>
                                                                <p className="text-xs font-black text-[#282728] leading-snug">{con.availability.split(',')[0]} <br /> <span className="text-gray-400 font-bold">{con.availability.split(',')[1]}</span></p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                                <Clock size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">SESSION LENGTH</p>
                                                                <p className="text-xs font-black text-[#282728] leading-snug">{con.sessionLength.split(',')[0]} <br /> <span className="text-gray-400 font-bold">{con.sessionLength.split(',')[1]}</span></p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                                <MessageSquare size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">SESSION FORMAT</p>
                                                                <p className="text-xs font-black text-[#282728] leading-snug">{con.sessionFormat}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                                <BookOpen size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">INSTITUTIONS</p>
                                                                <p className="text-xs font-black text-[#282728] leading-snug">{con.institutions}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Specialises In */}
                                                    <div className="mb-10">
                                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-4">SPECIALISES IN</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {con.specialisesIn.map((spec, i) => (
                                                                <span key={i} className="bg-white border border-gray-100 text-gray-600 text-[11px] font-bold px-4 py-2 rounded-xl shadow-sm">
                                                                    {spec}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bottom Action Bar */}
                                                <div className={`mt-auto p-6 flex justify-between items-center transition-colors duration-300 ${selection.consultant?.id === con.id ? 'bg-[#436235]/5' : 'bg-gray-50/50'
                                                    }`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${con.status === 'available' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Available Mon – Fri</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleConsultantSelect(con)}
                                                        className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-[0.1em] transition-all duration-300 flex items-center gap-2 ${selection.consultant?.id === con.id
                                                            ? 'bg-[#436235] text-white shadow-lg'
                                                            : 'bg-[#282728] text-white hover:bg-[#436235]'
                                                            }`}
                                                    >
                                                        {selection.consultant?.id === con.id ? 'Selected' : 'Select'}
                                                        {selection.consultant?.id === con.id ? <CheckCircle size={14} /> : <ChevronRight size={14} />}
                                                    </button>
                                                </div>
                                            </div>
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
                                            <form className="space-y-6" onSubmit={handleBookingSubmit}>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">First Name</label>
                                                        <input 
                                                            type="text" 
                                                            name="firstName"
                                                            value={selection.info.firstName}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="w-full bg-white border-none py-3 px-4 rounded-lg focus:ring-2 focus:ring-[#436235] shadow-sm" 
                                                            placeholder="John" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Last Name</label>
                                                        <input 
                                                            type="text" 
                                                            name="lastName"
                                                            value={selection.info.lastName}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="w-full bg-white border-none py-3 px-4 rounded-lg focus:ring-2 focus:ring-[#436235] shadow-sm" 
                                                            placeholder="Doe" 
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Email Address</label>
                                                    <input 
                                                        type="email" 
                                                        name="email"
                                                        value={selection.info.email}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full bg-white border-none py-3 px-4 rounded-lg focus:ring-2 focus:ring-[#436235] shadow-sm" 
                                                        placeholder="john@example.com" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Where are you currently located?</label>
                                                    <input 
                                                        type="text" 
                                                        name="currentCountry"
                                                        value={selection.info.currentCountry}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full bg-white border-none py-3 px-4 rounded-lg focus:ring-2 focus:ring-[#436235] shadow-sm" 
                                                        placeholder="e.g. Philippines, India, UAE" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Additional Message</label>
                                                    <textarea 
                                                        rows="4" 
                                                        name="message"
                                                        value={selection.info.message}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-white border-none py-3 px-4 rounded-lg focus:ring-2 focus:ring-[#436235] shadow-sm" 
                                                        placeholder="Tell us more about your inquiry..."
                                                    ></textarea>
                                                </div>
                                                
                                                {!bookingSuccess ? (
                                                    <div className="pt-6 border-t border-gray-200">
                                                        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                                            <Calendar className="w-5 h-5 text-[#436235]" /> Schedule with Google Calendar
                                                        </h4>
                                                        
                                                        {error && (
                                                            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
                                                                {error}
                                                            </div>
                                                        )}

                                                        <p className="text-gray-500 text-sm mb-6">Clicking below will save your details and open {selection.consultant?.name}'s calendar.</p>

                                                        <button
                                                            type="submit"
                                                            disabled={isSubmitting}
                                                            className="w-full bg-[#436235] text-white py-4 rounded-lg font-bold shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isSubmitting ? 'Processing...' : 'Book Appointment Time'}
                                                            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="pt-6 border-t border-gray-200 animate-fade-in">
                                                        <div className="text-center mb-8">
                                                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                <CheckCircle size={32} />
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Details Saved Successfully!</h3>
                                                            <p className="text-gray-500">Pick your preferred time slot below to finalize your consultation with {selection.consultant?.name}.</p>
                                                        </div>

                                                        <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-2xl bg-white min-h-[600px] relative">
                                                            <iframe 
                                                                src={`${selection.consultant?.bookingUrl}&name=${encodeURIComponent(selection.info.firstName + ' ' + selection.info.lastName)}&email=${encodeURIComponent(selection.info.email)}`} 
                                                                style={{ border: 0 }} 
                                                                width="100%" 
                                                                height="700" 
                                                                frameBorder="0"
                                                                className="w-full"
                                                            ></iframe>
                                                        </div>
                                                        
                                                        <div className="mt-8 text-center">
                                                            <button 
                                                                onClick={() => window.location.reload()}
                                                                className="text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
                                                            >
                                                                Need to make another booking? Click here to restart.
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </form>
                                        </div>

                                        <div className="bg-white p-8 rounded-3xl shadow-xl h-fit border border-gray-100">
                                            <h3 className="text-xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-50 tracking-wide uppercase">Your Selection</h3>

                                            <div className="space-y-8">
                                                <div className="flex items-start gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Service</p>
                                                        <p className="font-bold text-gray-800 line-clamp-1">{selection.category?.title}</p>
                                                    </div>
                                                </div>

                                                {selection.consultant && (
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
                                                )}
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
