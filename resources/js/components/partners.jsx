import React from "react";
import { motion } from "framer-motion";

const images = import.meta.glob("/resources/Assets/Partners/*", { eager: true, import: "default" });

const imageMap = Object.keys(images).reduce((acc, key) => {
    const filename = key.split("/").pop();
    acc[filename] = images[key];
    return acc;
}, {});

const PartnerLogos = () => {
    const partners = [
        { id: 1, name: "Aukland Institute of Studies", logo: "AIS.png", url: "https://ais.ac.nz" },
        { id: 2, name: "ICL Graduate Business School", logo: "icl.png", url: "https://icl.ac.nz" },
        { id: 3, name: "Skills", logo: "skills.png", url: "https://skills.org.nz" },
        { id: 7, name: "ATMC", logo: "ATMC.png", url: "https://atmc.ac.nz/" },
        { id: 8, name: "ATMC", logo: "UP.png", url: "https://www.up.education/" },
        { id: 9, name: "ATMC", logo: "SR.png", url: "https://studyreach.com/" },
        { id: 10, name: "ATMC", logo: "wintec.png", url: "https://www.wintec.ac.nz/" },
        { id: 11, name: "ATMC", logo: "NZtertiary.png", url: "https://www.nztertiarycollege.ac.nz/" },
        { id: 12, name: "ATMC", logo: "Bridge.png", url: "https://bridge.ac.nz/" },
        { id: 13, name: "ATMC", logo: "NZSE.png", url: "https://nzse.ac.nz/" },
        { id: 14, name: "ATMC", logo: "YOOBEE.png", url: "https://www.yoobee.ac.nz/" },
        { id: 15, name: "ATMC", logo: "ICA.png", url: "https://ica.ac.nz/" },
        { id: 16, name: "ATMC", logo: "ignite.png", url: "https://www.choosenewzealand.com/school/ignite-colleges/" },
        { id: 17, name: "ATMC", logo: "NStourism.png", url: "https://www.nzschooloftourism.co.nz/" },
        { id: 18, name: "ATMC", logo: "nzma.png", url: "https://www.nzma.ac.nz/" },
    ];

    // Duplicating the list to create a seamless loop
    const duplicatedPartners = [...partners, ...partners];

    return (
        <section className="bg-gray-100 py-8 relative overflow-hidden">
            <div className="max-w-full mx-auto px-4">
                <div className="text-center mb-12">
                    <p className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-2">Our Trusted Partners</p>
                    {/* <h2 className="text-3xl md:text-4xl font-black text-[#282728]">
                        Our Trusted Partners
                    </h2> */}
                </div>

                <div className="relative w-full overflow-hidden">
                    <motion.div
                        className="flex space-x-12 items-center w-max"
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            repeat: Infinity,
                            ease: "linear",
                            duration: 30, // Adjust speed here (higher = slower)
                        }}
                    >
                        {duplicatedPartners.map((partner, index) => (
                            <a
                                key={`${partner.id}-${index}`}
                                href={partner.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center flex-shrink-0 cursor-pointer group"
                            >
                                <img
                                    src={imageMap[partner.logo]}
                                    alt={partner.name}
                                    className="h-12 md:h-20 object-contain transition-all duration-300"
                                />
                            </a>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default PartnerLogos;
