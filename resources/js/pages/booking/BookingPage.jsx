import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
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
import bryllImg from "@assets/team/bryll.jpg";

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
        image: visaImg
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
            id: 2,
            name: 'Fhilip Bryll Añabeza',
            role: 'Education Consultant',
            image: bryllImg,
            bio: "Bryll supports international students with admissions, course selection, and pathway planning into New Zealand institutions.",
            tags: ['EDUCATION SPEC', 'EN'],
            status: 'available',
            availability: 'Mon – Fri, 9am – 5pm NZST',
            sessionLength: '45 – 60 min, Video',
            sessionFormat: 'Video Call or Phone',
            institutions: 'Nationwide Support',
            specialisesIn: ['Admissions', 'Course Matching', 'Pathway Planning', 'Student Support'],
            bookingUrl: 'https://go.epathways.co.nz/widget/bookings/meet-with-bryll-emma'
        },
        {
            id: 6,
            readOnly: true,
            name: 'Emma Ceballo',
            role: <>Head <br /> <span className="italic text-[8px] text-gray-500 font-medium mt-1 inline-block">Education Department</span></>,
            image: emmaImg,
            bio: "Emma is a dedicated education consultant helping international students seamlessly transition into the New Zealand education system, with a focus on holistic student success and pathway planning.",
            tags: ['EDUCATION SPEC', '5 YRS EXP', 'EN'],
            status: 'available',
            availability: 'Mon – Fri, 9am – 5pm NZST',
            sessionLength: '45 – 60 min, Video',
            sessionFormat: 'Video Call or Phone',
            institutions: 'Nationwide Support',
            specialisesIn: ['Pathway Planning', 'Course Matching', 'Student Support', 'Admissions'],
            bookingUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ2UC60-y5UinpTZqTSV_AMOwsLtuXpqYm3xGUI3WsjVjQQ9TcZPSv_ieaSi1CSlKDlL9OXabohZ?gv=true'
        },
        {
            id: 1,
            readOnly: true,
            name: 'Dinah Jabone',
            role: 'CEO / Founder',
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

export default function BookingPage({ visaTypes = [], availability = {}, bookingTimezone = "Pacific/Auckland" }) {
    const [step, setStep] = useState(1);
    const [openFaq, setOpenFaq] = useState(null);
    const [selection, setSelection] = useState({
        category: null,
        consultant: null,
        // For Education only: 'book' or 'enrol'. Other categories skip the
        // intent picker and go straight to the booking form.
        intent: null,
        info: {
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            country: '',
            inquiryType: '',
            visaTypeId: '',
            appointmentDate: '',
            appointmentTime: '',
            appointmentAt: '',
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

    // Resize listener only needs to fire while the consultant carousel is
    // mounted — that's step 2 for non-Education and step 3 for Education-Book.
    useEffect(() => {
        const onConsultant = (step === 2 && selection.category?.id !== 'education')
            || (step === 3 && selection.category?.id === 'education' && selection.intent === 'book');
        if (onConsultant) {
            checkScroll();
            window.addEventListener('resize', checkScroll);
            return () => window.removeEventListener('resize', checkScroll);
        }
    }, [step, selection.category, selection.intent]);

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
    // Guard so the auto-capture only records one booking per completed widget flow.
    const submittedRef = useRef(false);

    // Record the booking on our side from whatever details we captured. Called
    // automatically when the embedded GoHighLevel widget reports a completed
    // booking — its postMessage carries the name/email the visitor entered, so
    // no form fields are needed on our page.
    const createBooking = async (info) => {
        if (submittedRef.current) return;
        const firstName = (info.firstName || '').trim();
        const email = (info.email || '').trim();
        if (!firstName || !email) return; // not enough to record yet
        submittedRef.current = true;
        setIsSubmitting(true);
        try {
            const response = await fetch('/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: info.lastName || null,
                    email,
                    phone: info.phoneNumber || null,
                    current_country: info.country || null,
                    service_type: selection.category?.title,
                    consultant_name: selection.consultant?.name,
                    platform: selection.consultant?.bookingUrl?.includes('go.epathways') ? 'GoHighLevel' : 'Google Calendar',
                }),
            });
            if (response.ok) {
                setBookingSuccess(true);
            } else {
                submittedRef.current = false; // allow another attempt
            }
        } catch {
            submittedRef.current = false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateInfo = (patch) => setSelection(prev => ({ ...prev, info: { ...prev.info, ...patch } }));

    // In-system booking (immigration): the visitor picks a date + time on our
    // own calendar — no external widget — so we submit those details directly.
    const submitNativeBooking = async () => {
        setError(null);
        const info = selection.info;
        const firstName = (info.firstName || '').trim();
        const email = (info.email || '').trim();
        if (visaTypes.length > 0 && !info.visaTypeId) { setError('Please select a visa type.'); return; }
        if (!firstName || !email) { setError('Please enter your name and email.'); return; }
        if (!info.appointmentDate) { setError('Please pick a date on the calendar.'); return; }
        if (!info.appointmentTime) { setError('Please pick a time slot.'); return; }
        if (submittedRef.current) return;
        submittedRef.current = true;
        setIsSubmitting(true);
        try {
            const response = await fetch('/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: info.lastName || null,
                    email,
                    phone: info.phoneNumber || null,
                    current_country: info.country || null,
                    service_type: selection.category?.title,
                    visa_type_id: info.visaTypeId || null,
                    consultant_name: selection.consultant?.name || 'Immigration Advisers (Dev Bhageerutty & Hendry Dai)',
                    appointment_date: info.appointmentDate,
                    appointment_time: info.appointmentTime,
                    appointment_at: info.appointmentAt || null,
                    client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    message: info.message || null,
                    platform: 'In-System',
                }),
            });
            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                const bookingId = data.booking_id;
                // Booking is saved (unpaid). Hand off to Stripe Checkout; if it's
                // unavailable, we still show the saved (unpaid) confirmation.
                if (bookingId) {
                    try {
                        const co = await fetch(`/bookings/${bookingId}/checkout`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                            },
                        });
                        const coData = await co.json().catch(() => ({}));
                        if (co.ok && coData.url) {
                            window.location.href = coData.url;
                            return;
                        }
                    } catch { /* fall through to saved-unpaid confirmation */ }
                }
                setBookingSuccess(true);
            } else {
                submittedRef.current = false;
                const data = await response.json().catch(() => ({}));
                setError(data.message || 'Could not confirm your booking. Please try again.');
            }
        } catch {
            submittedRef.current = false;
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Listen to the embedded GoHighLevel widget. It posts the contact's details
    // as the visitor fills them in, and a completion event when they finish —
    // at which point we auto-create the booking in our system (name + email).
    useEffect(() => {
        const applyCaptured = (data) => {
            const possibleName = data.full_name || data.fullName || data.name || '';
            const captured = {
                firstName: data.first_name || (possibleName ? possibleName.trim().split(' ')[0] : ''),
                lastName: data.last_name || (possibleName ? possibleName.trim().split(' ').slice(1).join(' ') : ''),
                email: data.email || '',
                phoneNumber: data.phone || '',
            };
            setSelection(prev => ({ ...prev, info: { ...prev.info, ...captured } }));
            return captured;
        };

        const handleIframeMessage = (event) => {
            const isGHLArray = Array.isArray(event.data) && event.data.length >= 3;
            const inputStr = isGHLArray ? event.data[2] : null;

            if (isGHLArray && typeof inputStr === 'string' && ['contact_id', 'first_name', 'email', 'name', 'full_name'].some(k => inputStr.includes(k))) {
                try {
                    const payload = JSON.parse(inputStr);
                    if (payload.first_name || payload.email || payload.full_name || payload.name) applyCaptured(payload);
                } catch { /* not the payload we expect — ignore */ }
            } else if (event.data && typeof event.data === 'object') {
                const payload = event.data;
                if (['booking_completed', 'ghl_booking_complete'].includes(payload.event || payload.action || payload.type)) {
                    const captured = applyCaptured(payload.data || payload);
                    createBooking({ ...selection.info, ...captured });
                }
            }
        };

        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, [selection.consultant, selection.category]);

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleCategorySelect = (cat) => {
        // Resetting `intent` here keeps the Education branch clean if the
        // applicant comes back to switch categories.
        setSelection(prev => ({ ...prev, category: cat, consultant: null, intent: null }));
        nextStep();
    };

    const handleConsultantSelect = (con) => {
        setSelection(prev => ({ ...prev, consultant: con }));
        nextStep();
    };

    const handleIntentSelect = (intent) => {
        if (intent === 'enrol') {
            // Dedicated enrolment URL — same form as /free-assessment, but
            // leads submitted from here are tagged source=education-enrolment.
            window.location.href = '/education-enrolment';
            return;
        }
        setSelection(prev => ({ ...prev, intent }));
        nextStep(); // 2 → 3 (consultant for Education-Book branch)
    };

    // What should this step render? Education branch: 1=category, 2=intent,
    // 3=consultant, 4=form. Every other branch: 1=category, 2=consultant,
    // 3=form. Centralised here so step labels + background swaps stay in sync.
    const isEducation = selection.category?.id === 'education';
    const isImmigration = selection.category?.id === 'immigration';
    const ui = (() => {
        if (step === 1) return 'category';
        if (isEducation) {
            if (step === 2) return 'intent';
            if (step === 3) return selection.intent === 'book' ? 'consultant' : null;
            if (step === 4) return selection.intent === 'book' ? 'form' : null;
        } else if (isImmigration) {
            // Immigration skips consultant selection — advisers are shown for
            // display on the scheduler itself.
            if (step === 2) return 'form';
        } else {
            if (step === 2) return 'consultant';
            if (step === 3) return 'form';
        }
        return null;
    })();

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSelection(prev => ({
            ...prev,
            info: { ...prev.info, [name]: type === 'checkbox' ? checked : value }
        }));
    };

    const handleBookingSubmit = async (e) => {
        e?.preventDefault();
        
        if (!selection.info.firstName) return setError("Please fill in your details below so we can confirm your booking.");

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({
                    first_name: selection.info.firstName,
                    last_name: selection.info.lastName,
                    email: selection.info.email,
                    phone: selection.info.phoneNumber,
                    current_country: selection.info.country,
                    service_type: selection.category?.title,
                    consultant_name: selection.consultant?.name,
                    inquiry_type: selection.info.inquiryType,
                    appointment_date: selection.info.appointmentDate || null,
                    appointment_time: selection.info.appointmentTime || null,
                    message: selection.info.message,
                    platform: selection.consultant?.bookingUrl?.includes('go.epathways') ? 'GoHighLevel' : 'Google Calendar'
                })
            });

            if (response.ok) {
                setBookingSuccess(true);
            } else {
                try {
                    const data = await response.json();
                    setError(data.errors ? (Object.values(data.errors).flat()[0] || data.message) : (data.message || "Something went wrong. Please try again."));
                } catch {
                    setError("Something went wrong processing the server error.");
                }
            }
        } catch (error) {
            setError("Network error. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`min-h-screen font-urbanist transition-colors duration-500 ${ui === 'consultant' ? 'bg-[#121613]' : 'bg-[#F9F8F6]'}`}>
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
                            {ui === 'category' && (
                                <div>
                                    <div className="mb-16 text-center flex flex-col items-center">
                                        <span className="text-[11px] font-bold tracking-widest text-gray-600 uppercase mb-4 block">Step one</span>
                                        <h2 className="text-4xl md:text-5xl font-normal text-[#282728] mb-4">Select your service type</h2>
                                        <p className="text-gray-600 text-sm max-w-md">
                                            Pick the path that matches your goals
                                        </p>
                                    </div>

                                    <div className="flex flex-col md:flex-row h-auto gap-6 mb-24 max-w-6xl mx-auto items-stretch">
                                        {categories.map((cat, idx) => (
                                            <div
                                                key={cat.id}
                                                onClick={() => !cat.comingSoon && handleCategorySelect(cat)}
                                                className={`group relative flex-1 min-h-[450px] md:min-h-[500px] min-w-[200px] transition-all duration-500 ease-in-out bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 ${cat.comingSoon
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
                                                <div className={`absolute top-0 left-0 w-full h-1/2 transition-all duration-500 ease-in-out bg-gray-50 flex items-center justify-center overflow-hidden ${cat.comingSoon ? '' : 'md:group-hover:w-1/2 md:group-hover:h-full'
                                                    }`}>
                                                    <img src={cat.image} alt={cat.title} className={`w-full h-full object-cover transition-transform duration-700 ${cat.comingSoon ? 'grayscale-[30%]' : 'group-hover:scale-105'
                                                        }`} />
                                                </div>

                                                {/* Text Wrapper */}
                                                <div className={`absolute left-0 top-1/2 w-full h-1/2 transition-all duration-500 ease-in-out p-6 md:p-8 flex flex-col justify-center bg-white ${cat.comingSoon ? '' : 'md:group-hover:left-1/2 md:group-hover:top-0 md:group-hover:w-1/2 md:group-hover:h-full'
                                                    }`}>
                                                    <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-2 block">{cat.label}</span>
                                                    <h3 className="text-xl md:text-2xl font-black text-[#282728] mb-3 leading-tight">
                                                        {cat.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-3">
                                                        {cat.description}
                                                    </p>
                                                    <div className="mt-auto">
                                                        {cat.comingSoon ? (
                                                            <span className="flex items-center gap-2 text-gray-500 text-sm font-bold">
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
                                                <p className="text-gray-600 max-w-sm leading-relaxed">
                                                    Can't find an answer? Reach out and we'll get back to you within 3 hours.
                                                </p>
                                            </div>

                                            <div className="bg-[#282728] rounded-[24px] p-7 text-white relative overflow-hidden group shadow-xl max-w-sm">
                                                <div className="relative z-10">
                                                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#436235] uppercase mb-3 block">GET IN TOUCH</span>
                                                    <h3 className="text-xl font-black mb-6 leading-tight pr-10">Speak directly with <br />an advisor today</h3>

                                                    <div className="space-y-4">
                                                        <a href="tel:+6491234567" className="flex items-center gap-3 group/item hover:text-[#436235] transition-colors duration-300">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover/item:text-[#436235] group-hover/item:bg-[#436235]/10">
                                                                <Phone size={16} />
                                                            </div>
                                                            <span className="font-bold text-sm text-gray-200">+64 27 777 5586</span>
                                                        </a>
                                                        <a href="mailto:hello@epathways.co.nz" className="flex items-center gap-3 group/item hover:text-[#436235] transition-colors duration-300">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover/item:text-[#436235] group-hover/item:bg-[#436235]/10">
                                                                <Mail size={16} />
                                                            </div>
                                                            <span className="font-bold text-sm text-gray-200">info@epathways.co.nz</span>
                                                        </a>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                                                                <Clock size={16} />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-sm text-gray-200 block">Mon–Fri, 9am – 6pm</span>
                                                                <span className="text-[10px] text-gray-600 font-bold tracking-wider">NZST</span>
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
                                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${openFaq === idx ? 'bg-[#436235] border-[#436235] text-white rotate-45' : 'border-gray-200 text-gray-500 group-hover:border-[#436235] group-hover:text-[#436235]'}`}>
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
                                                                <p className="pb-8 text-gray-600 leading-relaxed max-w-lg">
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

                            {ui === 'consultant' && (
                                <div className="max-w-6xl mx-auto w-full">
                                    <div className="relative mb-16 text-center">
                                        <button onClick={prevStep} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                                            <ChevronLeft className="w-5 h-5" /> <span className="text-sm font-bold uppercase tracking-widest">Back</span>
                                        </button>
                                        <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-4 block">Step two</span>
                                        <h2 className="text-4xl md:text-5xl font-normal text-white mb-4">Meet your consultant</h2>
                                        <p className="text-gray-500 text-sm">
                                            Connect with the right expert for your needs
                                        </p>
                                    </div>

                                    <div className="relative w-full max-w-[1600px] mx-auto group/carousel">
                                        {canScrollLeft && (
                                            <button
                                                onClick={() => scroll('left')}
                                                className="absolute left-2 md:-left-8 lg:-left-12 xl:-left-16 top-[calc(50%-24px)] -translate-y-1/2 z-10 w-12 h-12 bg-[#1A1C19]/90 hover:bg-[#282728] backdrop-blur-md rounded-full flex items-center justify-center text-white border border-gray-700 transition-all shadow-2xl"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                        )}
                                        {canScrollRight && (
                                            <button
                                                onClick={() => scroll('right')}
                                                className="absolute right-2 md:-right-8 lg:-right-12 xl:-right-16 top-[calc(50%-24px)] -translate-y-1/2 z-10 w-12 h-12 bg-[#1A1C19]/90 hover:bg-[#282728] backdrop-blur-md rounded-full flex items-center justify-center text-white border border-gray-700 transition-all shadow-2xl"
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
                                                    onClick={() => !con.readOnly && handleConsultantSelect(con)}
                                                    className={`group relative flex flex-col md:flex-row bg-[#1A1C19] border border-gray-800 rounded-2xl overflow-hidden transition-all duration-300 min-h-[280px] md:min-h-0 md:h-[220px] lg:h-[240px] shrink-0 w-[85vw] md:w-[600px] lg:w-[calc(33.333%-16px)] lg:min-w-[400px] snap-start ${con.readOnly
                                                        ? 'cursor-default'
                                                        : 'cursor-pointer hover:border-gray-500 hover:shadow-2xl'
                                                        }`}
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
                                                            {con.readOnly ? (
                                                                <span className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                                                                    See you soon !
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-2 text-white text-sm font-medium transition-transform duration-300 group-hover:translate-x-2">
                                                                    Select <ChevronRight size={16} />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Image Wrapper */}
                                                    <div className="w-full md:w-1/2 bg-white flex items-center justify-center order-1 md:order-2 overflow-hidden">
                                                        {con.image ? (
                                                            <img src={con.image} alt={con.name} className={`w-full h-full object-cover object-top transition-transform duration-700 ${con.readOnly ? '' : 'group-hover:scale-105'}`} />
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

                            {/* Education-only intent picker — Book or Enrol.
                                Sits between category selection and consultant
                                selection. Other categories skip this entirely
                                and go straight to consultant. */}
                            {ui === 'intent' && (
                                <div className="max-w-5xl mx-auto w-full px-4 lg:px-8">
                                    <div className="text-center mb-12">
                                        <button onClick={prevStep} className="mb-6 p-2 -ml-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors inline-flex items-center">
                                            <ChevronLeft className="w-5 h-5 mr-1" /> <span className="text-sm font-bold uppercase tracking-widest text-black">Back</span>
                                        </button>
                                        <h2 className="text-4xl md:text-5xl font-light text-black mb-4">What would you like to do?</h2>
                                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                            With {selection.consultant?.name?.split(' ')[0]} as your education consultant, you can either book a consultation or jump straight to enrolment.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <button
                                            type="button"
                                            onClick={() => handleIntentSelect('book')}
                                            className="group relative bg-white rounded-3xl border border-gray-200 hover:border-[#436235] hover:shadow-2xl p-10 text-left transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#436235]/5 blur-[60px] rounded-full -mr-12 -mt-12 group-hover:bg-[#436235]/10 transition-colors" />
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-[#436235]/10 group-hover:bg-[#436235] group-hover:text-white text-[#436235] flex items-center justify-center mb-6 transition-colors">
                                                    <Calendar size={26} strokeWidth={1.5} />
                                                </div>
                                                <span className="text-[10px] font-bold tracking-[0.25em] text-[#436235] uppercase mb-2 block">Option 1</span>
                                                <h3 className="text-2xl font-black text-[#282728] mb-3">Book a consultation</h3>
                                                <p className="text-sm text-gray-600 leading-relaxed mb-8">
                                                    Talk one-on-one with {selection.consultant?.name?.split(' ')[0]} about pathways, programmes, and visa options before committing to a programme.
                                                </p>
                                                <span className="inline-flex items-center gap-2 text-[#282728] text-sm font-bold transition-transform duration-300 group-hover:translate-x-2">
                                                    Continue to booking <ChevronRight size={16} />
                                                </span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleIntentSelect('enrol')}
                                            className="group relative bg-white rounded-3xl border border-gray-200 hover:border-[#282728] hover:shadow-2xl p-10 text-left transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#282728]/5 blur-[60px] rounded-full -mr-12 -mt-12 group-hover:bg-[#282728]/10 transition-colors" />
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-[#282728]/10 group-hover:bg-[#282728] group-hover:text-white text-[#282728] flex items-center justify-center mb-6 transition-colors">
                                                    <BookOpen size={26} strokeWidth={1.5} />
                                                </div>
                                                <span className="text-[10px] font-bold tracking-[0.25em] text-[#282728] uppercase mb-2 block">Option 2</span>
                                                <h3 className="text-2xl font-black text-[#282728] mb-3">Enrol in a programme</h3>
                                                <p className="text-sm text-gray-600 leading-relaxed mb-8">
                                                    Already know what you want to study? Complete a free assessment so our team can match you to the right programme and intake.
                                                </p>
                                                <span className="inline-flex items-center gap-2 text-[#282728] text-sm font-bold transition-transform duration-300 group-hover:translate-x-2">
                                                    Start assessment <ChevronRight size={16} />
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {ui === 'form' && (
                                <div className="max-w-7xl mx-auto w-full px-4 lg:px-8">
                                    {!bookingSuccess ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                                            {/* Left Column: Headings & Info */}
                                            <div className="lg:col-span-4 flex flex-col">
                                                <div className="mb-12">
                                                    <button onClick={prevStep} className="mb-6 p-2 -ml-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors flex items-center">
                                                        <ChevronLeft className="w-5 h-5 mr-1" /> <span className="text-sm font-bold uppercase tracking-widest text-black">Finalize</span>
                                                    </button>
                                                    <h2 className="text-4xl md:text-5xl font-light text-black mb-6">Schedule your time</h2>
                                                    <p className="text-gray-600 text-lg mb-12">Pick a slot that works for you and confirm your details</p>

                                                    {/* Selection Summary */}
                                                    <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl mb-12">
                                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Service</p>
                                                        <p className="font-bold text-gray-900 mb-6">{selection.category?.title}</p>

                                                        {selection.consultant && (
                                                            <>
                                                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Consultant</p>
                                                                <div className="flex items-center gap-3 mt-2 mb-6">
                                                                    <img src={selection.consultant.image} alt="" className="w-12 h-12 rounded-full object-cover object-top border border-gray-200" />
                                                                    <div>
                                                                        <p className="font-bold text-gray-900">{selection.consultant.name}</p>
                                                                        {selection.consultant.role && <p className="text-xs text-gray-600">{selection.consultant.role}</p>}
                                                                    </div>
                                                                </div>

                                                    <div className="space-y-6 text-gray-600">
                                                        {selection.consultant?.name === 'Fhilip Bryll Añabeza' ? (
                                                            <>
                                                                <div className="flex items-center gap-4">
                                                                    <Phone className="w-5 h-5 text-black" />
                                                                    <span>+63 991 854 8675 (PH)</span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <MessageSquare className="w-5 h-5 text-black" />
                                                                    <span>+63 939 586 3654 (WhatsApp)</span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <Mail className="w-5 h-5 text-black" />
                                                                    <span>hello@epathways.ph</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
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
                                                            </>
                                                        )}
                                                    </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Who you'll meet — beside the form (immigration) */}
                                                {selection.category?.id === 'immigration' && (
                                                    <div>
                                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-3">Who you'll meet</p>
                                                        <div className="space-y-3">
                                                            {consultants.immigration.map((a) => (
                                                                <div key={a.id} className="relative overflow-hidden rounded-2xl bg-[#161917] h-32 flex shadow-sm">
                                                                    <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 leading-tight">{a.role}</p>
                                                                        <p className="text-white font-semibold text-lg mt-1.5 leading-tight">{a.name}</p>
                                                                        <p className="text-[10px] text-gray-500 mt-2">{a.availability}</p>
                                                                    </div>
                                                                    <div className="w-28 shrink-0 bg-gray-200">
                                                                        <img src={a.image} alt={a.name} className="w-full h-full object-cover object-top" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-[11px] text-gray-400 mt-3">Your session will be assigned to one of our licensed advisers.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column: Form */}
                                            <div className="lg:col-span-8">
                                                {selection.category?.id === 'immigration' ? (
                                                    <NativeScheduler
                                                        visaTypes={visaTypes}
                                                        availability={availability}
                                                        businessTz={bookingTimezone}
                                                        info={selection.info}
                                                        onChange={updateInfo}
                                                        onConfirm={submitNativeBooking}
                                                        isSubmitting={isSubmitting}
                                                        error={error}
                                                    />
                                                ) : (
                                                    <>
                                                        {selection.consultant?.bookingUrl && (
                                                            <div>
                                                                <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
                                                                    <label className="block text-sm font-light text-gray-800">Pick a time on the calendar</label>
                                                                    <a
                                                                        href={selection.consultant.bookingUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#436235] transition-colors"
                                                                    >
                                                                        <Calendar size={14} /> Open in new tab
                                                                    </a>
                                                                </div>
                                                                <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                                                    <iframe
                                                                        src={selection.consultant.bookingUrl}
                                                                        title="Booking calendar"
                                                                        className="w-full h-[640px] lg:h-[760px] block"
                                                                        style={{ border: 0 }}
                                                                        frameBorder="0"
                                                                        loading="lazy"
                                                                    ></iframe>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* No fields — once the visitor completes the booking in the
                                                            widget above, their name + email are captured automatically
                                                            and recorded on our side. */}
                                                        <p className="mt-4 text-xs text-gray-400">
                                                            Your details are captured automatically when you complete the booking above — no need to retype them.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="max-w-4xl mx-auto animate-fade-in py-12 md:py-20 text-center">

                                            <div className="w-24 h-24 mx-auto bg-[#436235]/5 rounded-full flex items-center justify-center mb-8 border border-[#436235]/10 relative">
                                                <div className="absolute inset-0 rounded-full border border-[#436235]/20 animate-ping opacity-20"></div>
                                                <CheckCircle size={40} strokeWidth={1} className="text-[#436235]" />
                                            </div>

                                            <h3 className="text-5xl md:text-6xl font-light text-black mb-6 tracking-tight">Booking Confirmed.</h3>

                                            <p className="text-gray-600 text-xl font-light max-w-4xl mx-auto leading-relaxed mb-16 px-4">
                                                We've successfully saved your details. You will receive an email shortly regarding your consultation{selection.consultant?.name ? <> with <span className="font-medium text-black">{selection.consultant.name}</span></> : ' with one of our advisers'}.
                                            </p>

                                            <div className="mt-12 text-center">
                                                <button
                                                    onClick={() => window.location.reload()}
                                                    className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm font-bold tracking-widest uppercase transition-colors group"
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

// Fallback weekly availability when no adviser has set theirs (Mon–Fri 9–5).
const DEFAULT_AVAILABILITY = {
    mon: { start: '09:00', end: '17:00' }, tue: { start: '09:00', end: '17:00' },
    wed: { start: '09:00', end: '17:00' }, thu: { start: '09:00', end: '17:00' },
    fri: { start: '09:00', end: '17:00' },
};
const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // JS getDay() index → key

const to12h = (t) => {
    const [h, m] = t.split(':').map(Number);
    const ap = h >= 12 ? 'PM' : 'AM';
    const hh = ((h + 11) % 12) + 1;
    return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
};

// Hourly slot starts within a start–end window (last start is one hour before
// end, since a consultation runs ~1 hour).
const slotsBetween = (start, end) => {
    const [sh] = start.split(':').map(Number);
    const [eh] = end.split(':').map(Number);
    const out = [];
    for (let h = sh; h < eh; h++) out.push(`${String(h).padStart(2, '0')}:00`);
    return out;
};

// In-system booking calendar for immigration consultations. Both advisers are
// shown for display (who you'll meet) — no selection — then the visitor picks a
// date (native react-day-picker, past/off-days disabled), a time slot, and
// enters their contact details, all saved to a Booking on confirm.
function NativeScheduler({ visaTypes = [], availability = {}, businessTz = 'Pacific/Auckland', info, onChange, onConfirm, isSubmitting, error }) {
    // Advisers' saved availability drives the bookable days + time slots;
    // fall back to Mon–Fri 9–5 if none has been set. Availability windows are in
    // the business timezone (NZ); the client sees each slot in their own.
    const avail = availability && Object.keys(availability).length ? availability : DEFAULT_AVAILABILITY;
    const disallowed = [0, 1, 2, 3, 4, 5, 6].filter((d) => !avail[DOW[d]]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [day, setDay] = useState(info.appointmentDate ? new Date(`${info.appointmentDate}T00:00:00`) : undefined);

    const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const showBoth = clientTz !== businessTz;
    const fmtIn = (date, tz) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });

    // Each NZ slot → exact UTC instant → labels in both the client's and the
    // business timezone. The stored time is NZ (for staff); the client sees local.
    const dayAvail = day ? avail[DOW[day.getDay()]] : null;
    const slots = useMemo(() => {
        if (! day || ! dayAvail) return [];
        return slotsBetween(dayAvail.start, dayAvail.end).map((t) => {
            const [hh] = t.split(':').map(Number);
            const utc = new Date(new TZDate(day.getFullYear(), day.getMonth(), day.getDate(), hh, 0, 0, businessTz).getTime());
            return { nzLabel: fmtIn(utc, businessTz), localLabel: fmtIn(utc, clientTz), utc: utc.toISOString() };
        });
    }, [day, dayAvail, businessTz, clientTz]);

    const localTimeLabel = info.appointmentAt ? fmtIn(new Date(info.appointmentAt), clientTz) : info.appointmentTime;

    const pickDay = (d) => {
        setDay(d);
        onChange({ appointmentDate: d ? format(d, 'yyyy-MM-dd') : '', appointmentTime: '', appointmentAt: '' });
    };

    const selectedVisa = visaTypes.find((v) => String(v.id) === String(info.visaTypeId));
    const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#436235]/30 focus:border-[#436235]";
    const canConfirm = (visaTypes.length === 0 || info.visaTypeId) && info.firstName?.trim() && info.email?.trim() && info.appointmentDate && info.appointmentTime && !isSubmitting;
    const payLabel = selectedVisa ? `Confirm & pay NZD $${selectedVisa.price}` : 'Confirm booking';

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">Select a date &amp; time</h3>
                <p className="text-sm text-gray-500 mt-0.5">Choose a slot that works for you and confirm your details below.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calendar */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex justify-center">
                    <DayPicker
                        mode="single"
                        selected={day}
                        onSelect={pickDay}
                        startMonth={today}
                        disabled={[{ before: today }, { dayOfWeek: disallowed }]}
                        style={{ '--rdp-accent-color': '#436235', '--rdp-accent-background-color': '#43623515' }}
                    />
                </div>

                {/* Time slots */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        {day ? `Times · ${format(day, 'EEE, d MMM yyyy')}` : 'Pick a date first'}
                    </p>
                    {day && showBoth && (
                        <p className="text-[11px] text-gray-400 mb-2">Shown in your timezone ({clientTz.replace('_', ' ')}). Adviser time is NZ.</p>
                    )}
                    {!day ? (
                        <div className="h-40 flex items-center justify-center text-sm text-gray-400 text-center">
                            Select a day on the calendar to see available times.
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-sm text-gray-400 text-center">
                            No times available on this day.
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {slots.map((s) => {
                                const active = info.appointmentAt === s.utc;
                                return (
                                    <button
                                        key={s.utc}
                                        type="button"
                                        onClick={() => onChange({ appointmentTime: s.nzLabel, appointmentAt: s.utc })}
                                        title={showBoth ? `NZ time: ${s.nzLabel}` : undefined}
                                        className={`px-2 py-1.5 rounded-lg text-sm font-medium border transition-colors ${active
                                            ? 'bg-[#436235] text-white border-[#436235]'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#436235] hover:text-[#436235]'}`}
                                    >
                                        {s.localLabel}
                                        {showBoth && <span className={`block text-[9px] ${active ? 'text-white/70' : 'text-gray-400'}`}>NZ {s.nzLabel}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Contact details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Your details</p>

                {/* Visa type — drives the consultation fee */}
                {visaTypes.length > 0 && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Visa type <span className="text-rose-500">*</span></label>
                        <select value={info.visaTypeId} onChange={(e) => onChange({ visaTypeId: e.target.value })} className={inputCls}>
                            <option value="">Select the visa you're applying for…</option>
                            {visaTypes.map((v) => (
                                <option key={v.id} value={v.id}>{v.name}{v.code ? ` (${v.code})` : ''} — NZD ${v.price}</option>
                            ))}
                        </select>
                        {selectedVisa && (
                            <div className="mt-2 flex items-start justify-between gap-3 bg-[#436235]/5 border border-[#436235]/15 rounded-xl px-3 py-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">{selectedVisa.name}</p>
                                    {selectedVisa.description && <p className="text-xs text-gray-500 mt-0.5">{selectedVisa.description}</p>}
                                    {selectedVisa.duration ? <p className="text-[11px] text-gray-400 mt-0.5">{selectedVisa.duration} min consultation</p> : null}
                                </div>
                                <p className="text-sm font-bold text-[#436235] whitespace-nowrap">NZD ${selectedVisa.price}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input className={inputCls} placeholder="First name *" value={info.firstName} onChange={(e) => onChange({ firstName: e.target.value })} />
                    <input className={inputCls} placeholder="Last name" value={info.lastName} onChange={(e) => onChange({ lastName: e.target.value })} />
                    <input className={inputCls} type="email" placeholder="Email *" value={info.email} onChange={(e) => onChange({ email: e.target.value })} />
                    <input className={inputCls} placeholder="Phone" value={info.phoneNumber} onChange={(e) => onChange({ phoneNumber: e.target.value })} />
                    <input className={`${inputCls} sm:col-span-2`} placeholder="Current country" value={info.country} onChange={(e) => onChange({ country: e.target.value })} />
                    <textarea className={`${inputCls} sm:col-span-2 resize-y`} rows={3} placeholder="Anything you'd like the adviser to know (optional)" value={info.message} onChange={(e) => onChange({ message: e.target.value })} />
                </div>

                {(info.appointmentDate && info.appointmentTime) && (
                    <div className="flex items-center gap-2 text-sm text-[#436235] bg-[#436235]/5 border border-[#436235]/15 rounded-xl px-3 py-2">
                        <Calendar size={15} /> {format(new Date(`${info.appointmentDate}T00:00:00`), 'EEEE, d MMMM yyyy')} at {localTimeLabel}
                        {showBoth && <span className="text-[#436235]/70">(NZ {info.appointmentTime})</span>}
                    </div>
                )}

                {error && <p className="text-sm text-rose-600">{error}</p>}

                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={!canConfirm}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#436235] text-white text-sm font-semibold rounded-xl hover:bg-[#375029] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? 'Confirming…' : payLabel}
                </button>
                <p className="text-[11px] text-gray-400 text-center">You'll receive a confirmation email. Times are shown in New Zealand time (NZST).</p>
            </div>
        </div>
    );
}
