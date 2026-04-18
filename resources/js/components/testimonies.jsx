import React, { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "react-feather"; // ✅ Import chevrons

const images = import.meta.glob("/resources/assets/Testimonies/*", { eager: true, import: "default" });

const imageMap = Object.keys(images).reduce((acc, key) => {
    const filename = key.split("/").pop();
    acc[filename] = images[key];
    return acc;
}, {});

const testimonials = [
    {
        name: "Kent Dinfer",
        role: "Health Care Support Worker",
        text: "I cannot thank ePathways enough for the incredible support and guidance they provided throughout my journey. Following their advice, I pursued my studies diligently, and within just one year, I secured a full- time job in the healthcare sector. This opportunity not only kick-started my career but also allowed me to achieve a significant milestone - buying my very first car at the age of 19. It's all thanks to the expertise and dedication of ePathways that I have been able to make such remarkable progress in my life. I am truly grateful for their assistance and would highly recommend ePathways to anyone seeking to achieve their dreams.",
        image: "testi1.png",
    },
    {
        name: "Julie Ann and Dennis",
        role: "Student and Nurse",
        text: "ePathways has been an invaluable guiding light in our journey to New Zealand. eP provided us with personalized support, handling all the immigration and settlement processes with expertise and efficiency. We were continually kept informed, making us feel valued as clients. Thanks to ePathways, we are now living our dream in New Zealand, and we wholeheartedly recommend their exceptional services to anyone looking to make a smooth transition to this beautiful country.",
        image: "testi2.png",
    },
    {
        name: "Mia Cristialen Boqueda",
        role: "Student Visa - Approved in 15 days",
        text: "I found working with ePathways really smooth all the way from the beginning when I didn't even know what the first step should be",
        image: "testi3.png",
    },
];

const TestimonialSlider = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % testimonials.length);
        }, 12000);
        return () => clearInterval(interval);
    }, []);

    const nextSlide = () => setIndex((prev) => (prev + 1) % testimonials.length);
    const prevSlide = () =>
        setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    return (
        <section className="py-16 bg-gray-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-2">Testimonials</p>
                    <h2 className="text-3xl md:text-4xl font-black text-[#282728] mb-4">
                        What They Say
                    </h2>
                </div>

                <div className="relative">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        {/* Image Section */}
                        <div className="w-full lg:w-1/2 flex justify-center">
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-green-700/5 rounded-2xl -rotate-3 transition-transform group-hover:rotate-0 duration-500"></div>
                                <img
                                    src={imageMap[testimonials[index].image]}
                                    alt={testimonials[index].name}
                                    className="relative w-80 h-[480px] object-cover rounded-2xl shadow-2xl z-10"
                                />
                                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-green-700/10 rounded-full -z-0"></div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="w-full lg:w-1/2">
                            <div className="space-y-8">
                                <div className="flex gap-1 text-green-700">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-current" />
                                    ))}
                                </div>

                                <div className="relative">
                                    <span className="absolute -top-10 -left-6 text-8xl text-green-700/10 font-serif leading-none">"</span>
                                    <p className="text-base md:text-lg text-gray-700 leading-relaxed font-light italic relative z-10">
                                        {testimonials[index].text}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-[#282728] uppercase">
                                        {testimonials[index].name}
                                    </h3>
                                    <p className="text-green-700 font-semibold tracking-wide mt-1">
                                        {testimonials[index].role}
                                    </p>
                                </div>

                                {/* Navigation */}
                                <div className="pt-8 flex items-center gap-8">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={prevSlide}
                                            className="p-3 rounded-full border border-gray-200 text-gray-400 hover:border-green-700 hover:text-green-700 transition-all duration-300"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={nextSlide}
                                            className="p-4 rounded-full border border-gray-200 text-gray-400 hover:border-green-700 hover:text-green-700 transition-all duration-300"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        {testimonials.map((_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setIndex(i)}
                                                className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${i === index ? "w-8 bg-green-700" : "w-4 bg-gray-200 hover:bg-gray-300"
                                                    }`}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TestimonialSlider;
