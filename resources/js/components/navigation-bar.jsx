import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@assets/newlogosite.png"

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const currentPath = window.location.pathname;

    const isShowingGetStarted = currentPath !== "/booking";


    return (
        <nav className="sticky top-0 z-50 bg-white text-black shadow-md font-urbanist ">
            <div className="container mx-auto px-4 py-5 flex items-center justify-between">

                {/* Logo - Left */}
                <div className="w-32 cursor-pointer flex-shrink-0">
                    <a href="/">
                        <img src={Logo} alt="Image not found" className="hover:scale-110" />
                    </a>
                </div>

                <ul className="hidden md:flex space-x-8 items-center font-medium absolute left-1/2 transform -translate-x-1/2">
                    <li><a href="/" className="hover:text-[#436235] transition-colors">Home</a></li>
                    <li><a href="/activities" className="hover:text-[#436235] transition-colors">Activities</a></li>

                    <li><a href="/coming-soon" className="hover:text-[#436235] transition-colors">Education</a></li>
                    <li><a href="/coming-soon" className="hover:text-[#436235] transition-colors">Immigration</a></li>
                    <li><a href="/coming-soon" className="hover:text-[#436235] transition-colors">Accommodation</a></li>
                    <li><a href="/coming-soon" className="hover:text-[#436235] transition-colors">About Us</a></li>
                </ul>

                {/* Button - Right */}
                <div className="hidden md:block flex-shrink-0">
                    {isShowingGetStarted && (
                        <a href="/booking" className="hover:bg-gray-700 bg-[#282728] text-white px-4 py-2 rounded text-sm font-medium">Book Free Consultation</a>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden focus:outline-none"
                    onClick={toggleMenu}
                >
                    {isOpen ? (
                        // Close Icon
                        <svg xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        // Hamburger Icon
                        <svg xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="md:hidden bg-white px-4 pb-4 space-y-2 text-sm font-medium overflow-hidden"
                    >
                        <li><a href="/" className="block py-2 hover:text-[#436235]">Home</a></li>
                    <li><a href="/activities" className="block py-2 hover:text-[#436235]">Activities</a></li>
                    <li><a href="/coming-soon" className="block py-2 hover:text-[#436235]">Education</a></li>
                    <li><a href="/coming-soon" className="block py-2 hover:text-[#436235]">Immigration</a></li>
                    <li><a href="/coming-soon" className="block py-2 hover:text-[#436235]">Accommodation</a></li>
                    <li><a href="/coming-soon" className="block py-2 hover:text-[#436235]">About Us</a></li>
                        {isShowingGetStarted && (
                            <div className="text-center">
                                <a href="/booking" className="hover:bg-gray-700 bg-[#282728] text-white px-3 py-2 rounded text-sm">Book Free Consultation</a>
                            </div>
                        )}
                    </motion.ul>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
