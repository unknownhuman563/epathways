import React from "react";
import ClientImg from "@assets/client.png";
import ProcessedImg from "@assets/processed.png";
import ApprovalImg from "@assets/aproval.png";
import RateImg from "@assets/rate.png";
import CountUp from "react-countup";

const LearnNZSection = () => {
    const stats = [
        { id: 1, value: 98, label: "Client Partners", icon: ClientImg },
        { id: 2, value: 238, label: "Application Processed", icon: ProcessedImg },
        { id: 3, value: 228, label: "Application Approved", icon: ApprovalImg },
        { id: 4, value: 100, suffix: "%", label: "Visa Approval Rate", icon: RateImg },
    ];

    // const information =[
    //     {title: "Paving the Path Towards your New Zealand Future", content:"we believe that success and fulfillment are achievable by providing people with better opportunities resulting in better lives, as we work towards building a better New Zealand for us all.", img: "" }
    // ]

    return (
        <section className="py-12 bg-white font-urbanist">
            {/* Title & Subtitle */}
            <div className="text-center max-w-1xl mx-auto mb-10 px-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    Learn About <span className="text-green-700">e</span>Pathways
                </h2>
                <p className="mt-4 text-gray-600 text-sm sm:text-base">
                    Discover how Epathways can guide you on your journey to New Zealand.
                    Learn about our services, support, and commitment to making your
                    migration process smoother and more achievable.
                </p>
            </div>

            {/* Video Section */}
            <div className="max-w-4xl mx-auto px-4">
                <div className="relative w-full overflow-hidden rounded-xl shadow-lg aspect-video">
                    <iframe
                        className="w-full h-full"
                        src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Fepathwaysnz%2Fvideos%2F751938037313412%2F&show_text=false&width=560&t=0"
                        title="Learn About New Epathways"
                        style={{ border: "none", overflow: "hidden" }}
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>

            <div className="max-w-5xl mx-auto text-center px-4 mt-10">
                {/* Heading */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Why choose <span className="text-green-900">e</span>Pathways as your
                    partner
                </h2>
                <p className="text-gray-600 mb-10 max-w-3xl mx-auto">
                    Epathways serves as a reliable and trusted partner in your visa
                    and migration journey, offering not only professional guidance but
                    also comprehensive support at every stage of the process. From assessing
                    your eligibility and preparing the necessary documentation to navigating
                    the complexities of visa requirements and ensuring full compliance with
                    regulations, our team is dedicated to making your transition as smooth and
                    stress-free as possible.
                </p>

            

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {stats.map((item) => (
                        <div
                            key={item.id}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col items-center shadow-sm hover:shadow-md transition cursor-pointer"
                        >
                            <img
                                src={item.icon}
                                alt={item.label}
                                className="w-15 h-15 mb-3 object-contain"
                            />
                            <p className="text-xl font-semibold text-gray-900">
                                <CountUp
                                    end={item.value}
                                    duration={2.5}
                                    suffix={item.suffix || ""}
                                    enableScrollSpy
                                    scrollSpyOnce
                                />
                            </p>
                            <p className="text-sm text-gray-600">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LearnNZSection;
