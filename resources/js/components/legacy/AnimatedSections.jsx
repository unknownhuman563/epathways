import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function AnimatedSection({ children, direction = "left" }) {
    const { ref, inView } = useInView({
        triggerOnce: true, // animate only once
        threshold: 0.1,    // trigger when 10% visible
    });

    const variants = {
        hidden: {
            opacity: 0,
            x: direction === "left" ? -100 : 100
        },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        },
    };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={variants}
        >
            {children}
        </motion.div>
    );
}
