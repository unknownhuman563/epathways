import { ArrowRight } from "react-feather";

const ConsultationSection = () => {
    const consultations = [
        {
            id: 1,
            name: "Epathways Philippines",
            description: "Egestas elit dui scelerisque ut eu purus aliquam vitae habitasse.",
            buttonText: "Let's Talk",
            link: "#",
        },
        {
            id: 2,
            name: "Epathways India",
            description: "Id eros pellentesque facilisi id mollis faucibus commodo enim.",
            buttonText: "Let's Talk",
            link: "#",
        },
        {
            id: 3,
            name: "Epathways Malaysia",
            description: "Nunc, pellentesque velit malesuada non massa arcu.",
            buttonText: "Let's Talk",
            link: "#",
        },
        {
            id: 4,
            name: "Epathways Country",
            description: "Imperdiet purus pellentesque sit mi nibh sit integer faucibus.",
            buttonText: "Let's Talk",
            link: "#",
        },
    ];

    return (
        <section className="py-12 bg-white font-urbanist">
            <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    Book for <span className="text-green-700">FREE</span> Consultation
                </h2>
            </div>

            {/* Grid of consultation options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 md:px-20">
                {consultations.map((item) => (
                    <div
                        key={item.id}
                        className="bg-gray-50 rounded-lg shadow-sm overflow-hidden 
                       hover:shadow-lg transform hover:scale-105 transition 
                       duration-300 ease-in-out cursor-pointer"
                    >
                        <div className="h-40 bg-gray-200 flex items-center justify-center">
                            {/* Placeholder image */}
                            <span className="text-gray-400">Image</span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-800">{item.name}</h3>
                            <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                            <a
                                href={item.link}
                                className="mt-4 inline-flex items-center text-green-700 font-semibold hover:underline"
                            >
                                {item.buttonText} <ArrowRight size={16} className="ml-1" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* See More button */}
            <div className="text-center mt-10">
                <button className="bg-green-900 text-white px-6 py-2 rounded-md hover:bg-green-800 transition-colors">
                    See More
                </button>
            </div>
        </section>
    );
};

export default ConsultationSection;
