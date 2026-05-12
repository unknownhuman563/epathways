import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@assets/newlogosite.png";

const NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/activities", label: "Activities" },
    { href: "/education-journey", label: "Education" },
    { href: "/immigration", label: "Immigration" },
    { href: "/accommodation", label: "Accommodation" },
    { href: "/about-us", label: "About Us" },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPath, setCurrentPath] = useState("/");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCurrentPath(window.location.pathname);
        }
    }, []);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const toggleMenu = () => setIsOpen((v) => !v);
    const closeMenu = () => setIsOpen(false);
    const isShowingGetStarted = currentPath !== "/booking";

    return (
        <nav className="sticky top-0 z-50 bg-white text-black shadow-md font-urbanist">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
                {/* Logo */}
                <div className="w-20 sm:w-24 lg:w-28 xl:w-32 cursor-pointer flex-shrink-0">
                    <a href="/" onClick={closeMenu}>
                        <img src={Logo} alt="ePathways" className="w-full h-auto transition-transform duration-200 hover:scale-105" />
                    </a>
                </div>

                {/* Desktop Links */}
                <ul className="hidden lg:flex items-center gap-6 xl:gap-8 font-medium text-sm xl:text-base">
                    {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                            <a
                                href={link.href}
                                className={`hover:text-[#436235] transition-colors ${
                                    currentPath === link.href ? "text-[#436235]" : ""
                                }`}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>

                {/* Desktop CTA */}
                <div className="hidden lg:block flex-shrink-0">
                    {isShowingGetStarted && (
                        <a
                            href="/booking"
                            className="hover:bg-gray-700 bg-[#282728] text-white px-4 xl:px-5 py-2 xl:py-2.5 rounded text-xs xl:text-sm font-medium whitespace-nowrap"
                        >
                            Book Free Consultation
                        </a>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isOpen}
                    className="lg:hidden focus:outline-none p-2 -mr-2"
                    onClick={toggleMenu}
                >
                    {isOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
                    >
                        <ul className="px-4 sm:px-6 py-4 flex flex-col divide-y divide-gray-100">
                            {NAV_LINKS.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        onClick={closeMenu}
                                        className={`block py-3 text-base font-medium transition-colors hover:text-[#436235] ${
                                            currentPath === link.href ? "text-[#436235]" : ""
                                        }`}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        {isShowingGetStarted && (
                            <div className="px-4 sm:px-6 pb-6">
                                <a
                                    href="/booking"
                                    onClick={closeMenu}
                                    className="block w-full text-center bg-[#282728] hover:bg-gray-700 text-white px-4 py-3 rounded text-sm font-medium"
                                >
                                    Book Free Consultation
                                </a>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
