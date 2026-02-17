import { useState, useEffect } from "react";
import { ChevronUp } from "react-feather";

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Show button after scrolling down 200px
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 200) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    // Smooth scroll to top
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isVisible && (
                <div className="flex ">
                    <a
                        href="https://forms.clickup.com/9003110473/f/8ca1429-27476/ZFL0N95I6L0K6QEPTD" 
                        target="_blank"
                        className="animate-zoom mr-4 p-3 rounded-full bg-green-800 text-white shadow-lg hover:bg-green-700 transition-all"
                    >Start your journey with us now!</a>
                    <button
                        onClick={scrollToTop}
                        className="p-3 rounded-full bg-green-800 text-white shadow-lg hover:bg-green-700 transition-all"
                    >
                        <ChevronUp size={24} />
                    </button>
                </div>



            )}
        </div>
    );
};

export default ScrollToTop;
