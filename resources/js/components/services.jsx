import { ArrowRight, ArrowLeft } from "react-feather";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const images = import.meta.glob("/resources/Assets/Services/*", { eager: true, import: "default" });

const imageMap = Object.keys(images).reduce((acc, key) => {
    const filename = key.split("/").pop(); // e.g. pathway.png
    acc[filename] = images[key];
    return acc;
}, {});

const ServicesSection = () => {
    const consultations = [
        { id: 1, img: "pathways.png", name: "Education Consultancy", description: "We assist you in identifying the right course that matches your skills and abilities, helping you find the perfect educational institution to pursue your academic goals. We make your dream of studying in New Zealand a reality. Our dedicated consultants guide you step by step through the application process, offering personalized support tailored to your goals. With us, you’ll experience a smooth and stress-free transition as you begin your exciting educational journey.", buttonText: "Learn More", link: "#" },
        { id: 2, img: "visa.png", name: "Immigration Consultancy", description: "We guide and process your visa requirements, ensuring that all necessary documents are completed accurately and submitted on time. Our goal is to simplify the visa application process and maximize your chances of success.", buttonText: "Learn More", link: "#" },
        // { id: 3, img: "agents.png", name: "Immigration Agent Choice", description: "We understand that selecting the right immigration agent is crucial. Our experts help you choose an immigration agent that aligns with your requirements, ensures seamless process.", buttonText: "Learn More", link: "#" },
        // { id: 4, img: "education.png", name: "Education Provider", description: "We make your dream of studying in New Zealand a reality. Our dedicated consultants guide you step by step through the application process, offering personalized support tailored to your goals. With us, you’ll experience a smooth and stress-free transition as you begin your exciting educational journey.", buttonText: "Learn More", link: "#" },
        { id: 5, img: "job.png", name: "Employment Provider", description: "We go beyond job searching, we connect you with opportunities that truly match your skills, experience, and aspirations. By leveraging our network and industry expertise, our team helps you secure a role that not only fits your career goals but also sets you up for long-term success.", buttonText: "Learn More", link: "#" },
        { id: 6, img: "settlement.png", name: "Settlement Assistance", description: "Moving to a new country is exciting, but it can also feel overwhelming. That’s why we’re here to make your transition easier. Our settlement services cover everything you need to feel at home in New Zealand—from finding accommodation and understanding healthcare to navigating everyday essentials.", buttonText: "Learn More", link: "#" },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(4);
    const [direction, setDirection] = useState(0);

    // Responsive: adjust items per page
    useEffect(() => {
        const handleResize = () => {
            setItemsPerPage(window.innerWidth < 768 ? 1 : 2);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const totalPages = Math.ceil(consultations.length / itemsPerPage);

    const nextSlide = () => {
        if (currentIndex < totalPages - 1) {
            setDirection(1);
            setCurrentIndex(currentIndex + 1);
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex(currentIndex - 1);
        }
    };

    const startIndex = currentIndex * itemsPerPage;
    const visibleItems = consultations.slice(startIndex, startIndex + itemsPerPage);

    return (
        <section className="py-12 bg-gray-100 font-urbanist relative overflow-hidden">
            <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    Services <span className="text-green-800">e</span>Pathways Offers
                </h2>
            </div>

            <div className="ml-5 mr-5  flex justify-center items-center gap-4">
                {/* Prev Button */}
                <button
                    onClick={prevSlide}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-40"
                >
                    <ArrowLeft />
                </button>

                {/* Carousel */}
                <div className="relative w-full max-w-1xl overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentIndex}
                            className={`grid gap-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${itemsPerPage}`}
                            custom={direction}
                            initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}   // ✅ fixed
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}  // 👈 swapped
                            transition={{ duration: 0.5 }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, info) => {
                                if (info.offset.x < -100 && currentIndex < totalPages - 1) {
                                    nextSlide();
                                }
                                if (info.offset.x > 100 && currentIndex > 0) {
                                    prevSlide();
                                }
                            }}
                        >
                            {visibleItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-gray-50 rounded-lg shadow-sm overflow-hidden 
                                                hover:shadow-lg transform hover:scale-102 transition 
                                                duration-300 ease-in-out cursor-pointer h-115"
                                >
                                    <div className="h-60 bg-gray-200 flex items-center justify-center">
                                        <img
                                            src={imageMap[item.img]} // fallback image if none provided
                                            alt={item.name}
                                            className="w-full h-full object-cover grayscale"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                                        <p className="mt-2 text-base text-gray-600 text-justify">{item.description}</p>
                                        {/* <a
                                            href={item.link}
                                            className="mt-4 inline-flex items-center text-green-700 font-semibold hover:underline"
                                        >
                                            {item.buttonText} <ArrowRight size={16} className="ml-1" />
                                        </a> */}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Next Button */}
                <button
                    onClick={nextSlide}
                    disabled={currentIndex === totalPages - 1}
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-40"
                >
                    <ArrowRight />
                </button>
            </div>

            {/* Progress Bar Indicator */}
            <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex
                            ? "bg-green-700 w-8"  // active bar (longer + filled)
                            : "bg-gray-300 w-4"   // inactive bar (shorter + light)
                            }`}
                    />
                ))}
            </div>

            {/* See More button */}
            {/* <div className="text-center mt-10">
                <button className="bg-green-900 text-white px-6 py-2 rounded-md hover:bg-green-800 transition-colors">
                    See More
                </button>
            </div> */}
        </section>
    );
};

export default ServicesSection;
