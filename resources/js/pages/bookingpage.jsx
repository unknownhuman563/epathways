import React, { useState, useRef, useEffect } from "react";
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
    BookOpen,
    MapPin,
    ArrowDown
} from "lucide-react";

// Assets
import heroBg from "@assets/Services/education.png";
import visaImg from "@assets/Services/visa.png";
import settlementImg from "@assets/Services/settlement.png";
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
        label: 'EDUCATION',
        image: heroBg
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
        label: 'IMMIGRATION',
        image: visaImg,
        comingSoon: true
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
        label: 'ACCOMMODATION',
        image: settlementImg,
        comingSoon: true
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
            name: 'Dinah Suarin',
            role: 'People Engagement and Wellbeing Champion',
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
            id: 6,
            name: 'Emma Ceballo',
            role: 'People Journey Experience Champion',
            image: emmaImg,
            bio: "Emma is a dedicated education consultant helping international students seamlessly transition into the New Zealand education system, with a focus on holistic student success and pathway planning.",
            tags: ['EDUCATION SPEC', '5 YRS EXP', 'EN'],
            status: 'available',
            availability: 'Mon – Fri, 9am – 5pm NZST',
            sessionLength: '45 – 60 min, Video',
            sessionFormat: 'Video Call or Phone',
            institutions: 'Nationwide Support',
            specialisesIn: ['Pathway Planning', 'Course Matching', 'Student Support', 'Admissions'],
            bookingUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0A25brqHYLx6o-iqanRiIG-jugrE62FGo4ryI_dQyPsPl8N1m3dr1VcP5rla8l8b-n3SEBy8r4?gv=true'
        },
        {
            id: 2,
            name: 'Emily Dela Pena',
            role: '',
            image: emilyImg,
            bio: "Emily is a former academic at the University of Auckland with over 12 years in tertiary education advising. She specialises in postgraduate pathways, research programmes, and helping professionals transition into NZ academic institutions from China and East Asia.",
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
            name: 'Dev Bhageerutty',
            role: 'Licensed Immigration Adviser',
            image: devImg,
            bio: "Dev is a senior advisor with extensive experience in NZ work and residency visas. He specialises in skilled migration and employer-assisted visa categories.",
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
            name: 'Hendry Dai',
            role: 'Licensed Immigration Adviser',
            image: daiImg,
            bio: "Hendry specializes in partner and family visa categories, ensuring all documentation meets rigorous NZ immigration standards for high approval rates.",
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
            phoneNumber: '',
            country: '',
            inquiryType: '',
            message: '',
            agreeTerms: false
        }
    });

    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth);
        }
    };

    useEffect(() => {
        if (step === 2) {
            checkScroll();
            window.addEventListener('resize', checkScroll);
            return () => window.removeEventListener('resize', checkScroll);
        }
    }, [step, selection.category]);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
            setTimeout(checkScroll, 350);
        }
    };

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
        const { name, value, type, checked } = e.target;
        setSelection(prev => ({
            ...prev,
            info: { ...prev.info, [name]: type === 'checkbox' ? checked : value }
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
                    phone: selection.info.phoneNumber,
                    current_country: selection.info.country,
                    service_type: selection.category.title,
                    consultant_name: selection.consultant.name,
                    inquiry_type: selection.info.inquiryType,
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
        <div className={`min-h-screen font-urbanist transition-colors duration-500 ${step === 2 ? 'bg-[#121613]' : 'bg-[#F9F8F6]'}`}>
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
                                    <div className="mb-16 text-center flex flex-col items-center">
                                        <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-4 block">Step one</span>
                                        <h2 className="text-4xl md:text-5xl font-normal text-[#282728] mb-4">Select your service type</h2>
                                        <p className="text-gray-500 text-sm max-w-md">
                                            Pick the path that matches your goals
                                        </p>
                                    </div>

                                    <div className="flex flex-col md:flex-row h-auto gap-6 mb-24 max-w-6xl mx-auto items-stretch">
                                        {categories.map((cat, idx) => (
                                            <div
                                                key={cat.id}
                                                onClick={() => !cat.comingSoon && handleCategorySelect(cat)}
                                                className={`group relative flex-1 min-h-[450px] md:min-h-[500px] min-w-[200px] transition-all duration-500 ease-in-out bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 ${
                                                    cat.comingSoon
                                                        ? 'cursor-not-allowed opacity-80'
                                                        : 'cursor-pointer hover:shadow-xl hover:flex-[2] md:hover:flex-[2.5]'
                                                }`}
                                            >
                                                {/* Coming Soon Badge */}
                                                {cat.comingSoon && (
                                                    <div className="absolute top-4 right-4 z-20 bg-[#282728] text-white text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"></span>
                                                        Coming Soon
                                                    </div>
                                                )}

                                                {/* Image Wrapper */}
                                                <div className={`absolute top-0 left-0 w-full h-1/2 transition-all duration-500 ease-in-out bg-gray-50 flex items-center justify-center overflow-hidden ${
                                                    cat.comingSoon ? '' : 'md:group-hover:w-1/2 md:group-hover:h-full'
                                                }`}>
                                                    <img src={cat.image} alt={cat.title} className={`w-full h-full object-cover transition-transform duration-700 ${
                                                        cat.comingSoon ? 'grayscale-[30%]' : 'group-hover:scale-105'
                                                    }`} />
                                                </div>

                                                {/* Text Wrapper */}
                                                <div className={`absolute left-0 top-1/2 w-full h-1/2 transition-all duration-500 ease-in-out p-6 md:p-8 flex flex-col justify-center bg-white ${
                                                    cat.comingSoon ? '' : 'md:group-hover:left-1/2 md:group-hover:top-0 md:group-hover:w-1/2 md:group-hover:h-full'
                                                }`}>
                                                    <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-2 block">{cat.label}</span>
                                                    <h3 className="text-xl md:text-2xl font-black text-[#282728] mb-3 leading-tight">
                                                        {cat.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3">
                                                        {cat.description}
                                                    </p>
                                                    <div className="mt-auto">
                                                        {cat.comingSoon ? (
                                                            <span className="flex items-center gap-2 text-gray-400 text-sm font-bold">
                                                                Not available yet
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-2 text-[#282728] text-sm font-bold transition-transform duration-300 md:group-hover:translate-x-2">
                                                                Choose <ChevronRight size={16} />
                                                            </span>
                                                        )}
                                                    </div>
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
                                                            <span className="font-bold text-sm text-gray-200">+64 27 777 5586</span>
                                                        </a>
                                                        <a href="mailto:hello@epathways.co.nz" className="flex items-center gap-3 group/item hover:text-[#436235] transition-colors duration-300">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover/item:text-[#436235] group-hover/item:bg-[#436235]/10">
                                                                <Mail size={16} />
                                                            </div>
                                                            <span className="font-bold text-sm text-gray-200">info@epathways.co.nz</span>
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
                                <div className="max-w-6xl mx-auto w-full">
                                    <div className="relative mb-16 text-center">
                                        <button onClick={prevStep} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors">
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-4 block">Step two</span>
                                        <h2 className="text-4xl md:text-5xl font-normal text-white mb-4">Meet your consultant</h2>
                                        <p className="text-gray-400 text-sm">
                                            Connect with the right expert for your needs
                                        </p>
                                    </div>

                                    <div className="relative w-full max-w-[1600px] mx-auto group/carousel">
                                        {canScrollLeft && (
                                            <button 
                                                onClick={() => scroll('left')}
                                                className="absolute left-0 md:left-6 xl:left-8 top-[calc(50%-24px)] -translate-y-1/2 z-10 w-12 h-12 bg-[#1A1C19]/90 hover:bg-[#282728] backdrop-blur-md rounded-full flex items-center justify-center text-white border border-gray-700 transition-all shadow-2xl"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                        )}
                                        {canScrollRight && (
                                            <button 
                                                onClick={() => scroll('right')}
                                                className="absolute right-0 md:right-6 xl:right-8 top-[calc(50%-24px)] -translate-y-1/2 z-10 w-12 h-12 bg-[#1A1C19]/90 hover:bg-[#282728] backdrop-blur-md rounded-full flex items-center justify-center text-white border border-gray-700 transition-all shadow-2xl"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        )}
                                        <div 
                                            ref={scrollContainerRef}
                                            onScroll={checkScroll}
                                            className="flex overflow-x-auto gap-6 w-full pb-12 snap-x snap-mandatory px-4 md:px-24 xl:px-28 [&::-webkit-scrollbar]:hidden" 
                                            style={{ scrollbarWidth: 'none' }}
                                        >
                                            {selection.category && consultants[selection.category.id]?.map((con) => (
                                                <div
                                                    key={con.id}
                                                    onClick={() => handleConsultantSelect(con)}
                                                    className="group flex flex-col md:flex-row bg-[#1A1C19] border border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:border-gray-500 hover:shadow-2xl transition-all duration-300 min-h-[280px] md:min-h-0 md:h-[220px] lg:h-[240px] shrink-0 w-[85vw] md:w-[600px] lg:w-[calc(33.333%-16px)] lg:min-w-[400px] snap-start"
                                                >
                                                    {/* Text Wrapper */}
                                                    <div className="w-full md:w-1/2 p-6 xl:p-8 flex flex-col justify-center order-2 md:order-1">
                                                        {con.role && (
                                                            <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase mb-4 block">
                                                                {con.role}
                                                            </span>
                                                        )}
                                                        <h3 className="text-xl xl:text-2xl font-normal text-white mb-8 leading-tight">
                                                            {con.name}
                                                        </h3>
                                                        <div className="mt-auto">
                                                            <span className="flex items-center gap-2 text-white text-sm font-medium transition-transform duration-300 group-hover:translate-x-2">
                                                                Select <ChevronRight size={16} />
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Image Wrapper */}
                                                    <div className="w-full md:w-1/2 bg-white flex items-center justify-center order-1 md:order-2 overflow-hidden">
                                                        {con.image ? (
                                                            <img src={con.image} alt={con.name} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                                                        ) : (
                                                            <div className="w-full h-full bg-[#2C3029] flex items-center justify-center">
                                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                                    <polyline points="21 15 16 10 5 21"></polyline>
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="max-w-7xl mx-auto w-full px-4 lg:px-8">
                                    {!bookingSuccess ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                                        
                                        {/* Left Column: Headings & Info */}
                                        <div className="lg:col-span-4 flex flex-col">
                                            <div className="mb-12">
                                                <button onClick={prevStep} className="mb-6 p-2 -ml-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors flex items-center">
                                                    <ChevronLeft className="w-5 h-5 mr-1" /> <span className="text-sm font-bold uppercase tracking-widest text-black">Finalize</span>
                                                </button>
                                                <h2 className="text-4xl md:text-5xl font-light text-black mb-6">Schedule your time</h2>
                                                <p className="text-gray-600 text-lg mb-12">Pick a slot that works for you and confirm your details</p>
                                                
                                                {/* Selection Summary */}
                                                <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl mb-12">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Service</p>
                                                    <p className="font-bold text-gray-900 mb-6">{selection.category?.title}</p>
                                                    
                                                    {selection.consultant && (
                                                        <>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Consultant</p>
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <img src={selection.consultant.image} alt="" className="w-12 h-12 rounded-full object-cover object-top border border-gray-200" />
                                                                <div>
                                                                    <p className="font-bold text-gray-900">{selection.consultant.name}</p>
                                                                    {selection.consultant.role && <p className="text-xs text-gray-500">{selection.consultant.role}</p>}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="space-y-6 text-gray-600">
                                                    <div className="flex items-center gap-4">
                                                        <Mail className="w-5 h-5 text-black" />
                                                        <span>info@epathways.co.nz</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Phone className="w-5 h-5 text-black" />
                                                        <span>+64 27 777 5586</span>
                                                    </div>
                                                    <div className="flex items-start gap-4">
                                                        <MapPin className="w-5 h-5 text-black shrink-0 mt-1" />
                                                        <span>Auckland, New Zealand</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Form */}
                                        <div className="lg:col-span-8">
                                            <form className="space-y-8" onSubmit={handleBookingSubmit}>
                                                
                                                {/* Row 1 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-light text-gray-800 mb-2">First name</label>
                                                        <input 
                                                            type="text" 
                                                            name="firstName"
                                                            value={selection.info.firstName}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="w-full bg-[#F3F4F6] border-none py-3 px-4 rounded-sm focus:ring-1 focus:ring-gray-300" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-light text-gray-800 mb-2">Last name</label>
                                                        <input 
                                                            type="text" 
                                                            name="lastName"
                                                            value={selection.info.lastName}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="w-full bg-[#F3F4F6] border-none py-3 px-4 rounded-sm focus:ring-1 focus:ring-gray-300" 
                                                        />
                                                    </div>
                                                </div>

                                                {/* Row 2 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-light text-gray-800 mb-2">Email</label>
                                                        <input 
                                                            type="email" 
                                                            name="email"
                                                            value={selection.info.email}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="w-full bg-[#F3F4F6] border-none py-3 px-4 rounded-sm focus:ring-1 focus:ring-gray-300" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-light text-gray-800 mb-2">Phone number</label>
                                                        <input 
                                                            type="tel" 
                                                            name="phoneNumber"
                                                            value={selection.info.phoneNumber}
                                                            onChange={handleInputChange}
                                                            required
                                                            className="w-full bg-[#F3F4F6] border-none py-3 px-4 rounded-sm focus:ring-1 focus:ring-gray-300" 
                                                        />
                                                    </div>
                                                </div>

                                                {/* Row 3 */}
                                                <div>
                                                    <label className="block text-sm font-light text-gray-800 mb-2">Your country of residence</label>
                                                    <select 
                                                        name="country"
                                                        value={selection.info.country}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full bg-[#F3F4F6] border-none py-3 px-4 rounded-sm focus:ring-1 focus:ring-gray-300 text-gray-500"
                                                    >
                                                        <option value="" disabled>Select your country</option>
                                                        <option value="ph">Philippines</option>
                                                        <option value="in">India</option>
                                                        <option value="ae">UAE</option>
                                                        <option value="cn">China</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>

                                                {/* Row 4 */}
                                                <div>
                                                    <label className="block text-sm font-light text-gray-800 mb-4">What brings you here?</label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                                        {['Student visa', 'Work visa', 'Permanent residency', 'Study abroad', 'Housing assistance', 'Other'].map((type) => (
                                                            <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                                                <div className={`w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center transition-colors ${selection.info.inquiryType === type ? 'border-[#436235]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                                                    {selection.info.inquiryType === type && <div className="w-2.5 h-2.5 rounded-full bg-[#436235]" />}
                                                                </div>
                                                                <input 
                                                                    type="radio" 
                                                                    name="inquiryType" 
                                                                    value={type}
                                                                    checked={selection.info.inquiryType === type}
                                                                    onChange={handleInputChange}
                                                                    className="hidden"
                                                                />
                                                                <span className="text-sm text-gray-700">{type}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Google Calendar */}
                                                <div>
                                                    <label className="block text-sm font-light text-gray-800 mb-2">Select a time for your consultation</label>
                                                    <div className="w-full bg-white rounded-sm border border-gray-200 overflow-hidden h-[500px]">
                                                        <iframe 
                                                            src={selection.consultant?.bookingUrl} 
                                                            style={{ border: 0 }} 
                                                            width="100%" 
                                                            height="100%" 
                                                            frameBorder="0"
                                                        ></iframe>
                                                    </div>
                                                </div>

                                                {/* Row 5 */}
                                                <div>
                                                    <label className="block text-sm font-light text-gray-800 mb-2">Additional details</label>
                                                    <textarea 
                                                        rows="5" 
                                                        name="message"
                                                        value={selection.info.message}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-[#F3F4F6] border-none py-3 px-4 rounded-sm focus:ring-1 focus:ring-gray-300 resize-none" 
                                                        placeholder="Tell us anything else we should know"
                                                    ></textarea>
                                                </div>

                                                {/* Checkbox */}
                                                <label className="flex items-start gap-3 cursor-pointer group pt-2">
                                                    <div className={`w-5 h-5 mt-0.5 border flex flex-shrink-0 items-center justify-center transition-colors ${selection.info.agreeTerms ? 'bg-[#436235] border-[#436235]' : 'bg-[#F3F4F6] border-gray-300 group-hover:border-gray-400'}`}>
                                                        {selection.info.agreeTerms && <CheckCircle className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        name="agreeTerms"
                                                        checked={selection.info.agreeTerms}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="hidden"
                                                    />
                                                    <span className="text-sm text-gray-700 font-light">I agree to the terms and conditions</span>
                                                </label>

                                                {/* Submit & Error */}
                                                <div className="pt-6">
                                                    {error && (
                                                        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm font-medium animate-fade-in">
                                                            {error}
                                                        </div>
                                                    )}
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting || !selection.info.agreeTerms}
                                                        className="bg-[#436235] text-white px-8 py-3 rounded-sm font-medium hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                                                    >
                                                        {isSubmitting ? 'Processing...' : 'Book now'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                    ) : (
                                        <div className="max-w-4xl mx-auto animate-fade-in py-12 md:py-20 text-center">
                                            
                                            <div className="w-24 h-24 mx-auto bg-[#436235]/5 rounded-full flex items-center justify-center mb-8 border border-[#436235]/10 relative">
                                                <div className="absolute inset-0 rounded-full border border-[#436235]/20 animate-ping opacity-20"></div>
                                                <CheckCircle size={40} strokeWidth={1} className="text-[#436235]" />
                                            </div>
                                            
                                            <h3 className="text-5xl md:text-6xl font-light text-black mb-6 tracking-tight">Booking Confirmed.</h3>
                                            
                                            <p className="text-gray-500 text-xl font-light max-w-4xl mx-auto leading-relaxed mb-16 px-4">
                                                We've successfully saved your details. You will receive an email shortly regarding your consultation with <span className="font-medium text-black">{selection.consultant?.name}</span>.
                                            </p>
                                            
                                            <div className="mt-12 text-center">
                                                <button 
                                                    onClick={() => window.location.reload()}
                                                    className="inline-flex items-center gap-2 text-gray-400 hover:text-black text-sm font-bold tracking-widest uppercase transition-colors group"
                                                >
                                                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                                    Start a new booking
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
