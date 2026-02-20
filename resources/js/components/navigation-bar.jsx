import React, { useState } from "react";
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

                {/* Desktop Menu - Center */}
                <ul className="hidden md:flex space-x-8 items-center font-medium absolute left-1/2 transform -translate-x-1/2">
                    <li><a href="/" className="hover:text-[#436235] transition-colors">Home</a></li>

                    {/* Education Dropdown */}
                    <li className="relative group py-5">
                        <button className="flex items-center gap-1 hover:text-[#436235] transition-colors group-hover:text-[#436235]">
                            Education
                            <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute top-full left-0 w-64 bg-white shadow-2xl rounded-b-lg border-t-2 border-[#436235] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <ul className="py-2">
                                <li>
                                    <a href="/education-journey" className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#436235] transition-colors">
                                        Education Journey
                                    </a>
                                </li>
                                <li>
                                    <a href="/programs-levels" className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#436235] transition-colors">
                                        Programs & Levels
                                    </a>
                                </li>
                                <li>
                                    <a href="/fee-guide" className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#436235] transition-colors">
                                        Estimated Cost / Fee Guide
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>

                    <li><a href="#accommodation" className="hover:text-[#436235] transition-colors">Accommodation</a></li>
                    <li><a href="#immigration" className="hover:text-[#436235] transition-colors">Immigration</a></li>
                    <li><a href="/about-us" className="hover:text-[#436235] transition-colors">About Us</a></li>
                </ul>

                {/* Button - Right */}
                <div className="hidden md:block flex-shrink-0">
                    {isShowingGetStarted && (
                        <a href="https://forms.clickup.com/9003110473/f/8ca1429-27476/ZFL0N95I6L0K6QEPTD" className="hover:bg-gray-700 bg-[#282728] text-white px-4 py-2 rounded text-sm font-medium">Start your journey with us now</a>
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
            {isOpen && (
                <ul className="md:hidden bg-white px-4 pb-4 space-y-2">
                    <li><a href="/programs-levels" className="hover:text-[#436235]">Programs & Levels</a></li>
                    <li><a href="/fee-guide" className="hover:text-[#436235]">Fee Guide</a></li>
                    <li><a href="#accommodation" className="hover:text-[#436235]">Accommodation</a></li>
                    <li><a href="#immigration" className="hover:text-green-600">Immigration</a></li>
                    <li><a href="/about-us" className="hover:text-green-600">About Us</a></li>
                    {isShowingGetStarted && (
                        <div className="text-center">
                            <a href="https://forms.clickup.com/9003110473/f/8ca1429-27476/ZFL0N95I6L0K6QEPTD" className="hover:bg-gray-700 bg-[#282728] text-white px-3 py-2 rounded text-sm">Start your journey with us now</a>
                        </div>
                    )}
                </ul>
            )}
        </nav>
    );
};

export default Navbar;
