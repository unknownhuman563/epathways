import React from "react";
import { Facebook, Mail, Twitter, Linkedin, Instagram } from "lucide-react";

const images = import.meta.glob("/resources/Assets/team/*", { eager: true, import: "default" });

const imageMap = Object.keys(images).reduce((acc, key) => {
    const filename = key.split("/").pop();
    acc[filename] = images[key];
    return acc;
}, {});

const teamMembers = [
    {
        name: "Dev Bhageerutty",
        role: "CEO, Founding Member",
        image: "Dev.png",
        description:
            "Dev Bhageerutty is a distinguished founding member of Employment Pathways and a visionary leader, who has been instrumental in shaping the company’s mission and driving its success. As the People Experience and Capability Champion, Dev ensures that the company’s employees have a positive and productive work experience, while also developing their skills and capabilities to meet the needs of clients. ",
        socials: {
            facebook: "#",
            email: "mailto:john@example.com",
            twitter: "#",
            linkedin: "#",
            instagram: "#",
        },
    },
    {
        name: "Dinah Suarin",
        role: "CO, Founding Member",
        image: "dina.png",
        description:
            "Dinah Suarin, the Co-Founder member of ePathways, is a dedicated People Engagement and Wellbeing Champion. Passionate about creating harmonious vibes, she implements innovative programs to foster people development, work-life balance, and mental health support.",
        socials: {
            facebook: "#",
            email: "mailto:patricia@example.com",
            twitter: "#",
            linkedin: "#",
            instagram: "#",
        },
    },
    {
        name: "Emma Ceballo",
        role: "People Journey Experience Champion",
        image: "emma.png",
        description:
            "Emma Ceballo is the People Journey Experience Champion at ePathways, where she helps create a positive and engaging workplace culture. Passionate about people and growth, she ensures that every team member’s experience reflects ePathways’ commitment to trust, support, and excellence.",
        socials: {
            facebook: "#",
            email: "emma@epathways.co.nz",
            twitter: "#",
            linkedin: "#",
            instagram: "#",
        },
    },
    {
        name: "Hendry Dai",
        role: "Liscence Immigration Adviser",
        image: "dai.png",
        description:
            "Hendry Dai is a Licensed Immigration Adviser at ePathways, dedicated to guiding clients through their visa and migration journeys with expertise and care. With a focus on accuracy, transparency, and personalized service, he helps individuals and families achieve their migration goals smoothly and confidently.",
        socials: {
            facebook: "#",
            email: "visa@epathways.co.nz",
            twitter: "#",
            linkedin: "#",
            instagram: "#",
        },
    },
    {
        name: "Nova Palaca",
        role: "Finance Admin Champion",
        image: "nova.png",
        description:
            "Nova Pacalna is the Finance Admin Champion at ePathways, ensuring smooth and efficient financial operations within the organization. With a keen eye for detail and a passion for accuracy, she supports the company’s mission by managing resources responsibly and keeping processes running seamlessly.",
        socials: {
            facebook: "#",
            email: "nova@epathways.co.nz",
            twitter: "#",
            linkedin: "#",
            instagram: "#",
        },
    },
    {
        name: "Emily Dela Pena",
        role: "",
        image: "emily.png",
        description:
            "Serving as the main point of contact for clients throughout their visa and migration journey. With her approachable communication style and commitment to excellent service, she ensures that every client feels informed, supported, and valued at every step.",
        socials: {
            facebook: "#",
            email: "nova@epathways.co.nz",
            twitter: "#",
            linkedin: "#",
            instagram: "#",
        },
    },

];

export default function TeamSection() {
    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#282728] uppercase tracking-widest mb-4">
                        The Team behind <span className="text-green-700 font-light">e</span>Pathways
                    </h2>
                    <div className="w-20 h-1 bg-green-700 mx-auto"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {teamMembers.map((member, index) => (
                        <div
                            key={index}
                            className="group relative h-[320px] rounded-2xl overflow-hidden cursor-pointer"
                        >
                            {/* Member Image */}
                            <img
                                src={imageMap[member.image]}
                                alt={member.name}
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#282728] via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

                            {/* Content */}
                            <div className="absolute inset-0 p-5 flex flex-col justify-end">
                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold text-white mb-0.5 group-hover:text-[#4ade80] transition-colors duration-300">
                                        {member.name}
                                    </h3>
                                    <p className="text-xs text-white/70 font-light mb-3">
                                        {member.role}
                                    </p>

                                    {/* Revealable Description */}
                                    <div className="max-h-0 overflow-hidden group-hover:max-h-24 transition-all duration-500 ease-in-out">
                                        <p className="text-xs text-white/60 font-light leading-relaxed border-t border-white/10 pt-3 italic">
                                            {member.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
