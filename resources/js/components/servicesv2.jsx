
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation } from "swiper";

const CardCarousel = () => {
    const cards = [
        { id: 1, category: "Category", title: "1 Title", author: "Jane Doe", role: "Role" },
        { id: 2, category: "Category", title: "2 Title", author: "John Smith", role: "Role" },
        { id: 3, category: "Category", title: "3 Title", author: "Alice Brown", role: "Role" },
        { id: 4, category: "Category", title: "4 Articles", author: "Bob Lee", role: "Role" },
    ];

    return (
        <div className="py-10 max-w-5xl mx-auto">
            <Swiper
                effect="coverflow"
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={"auto"}
                loop={true}
                navigation={true}
                coverflowEffect={{
                    rotate: 0,
                    stretch: 0,
                    depth: 150,
                    modifier: 2.5,
                    slideShadows: false,
                }}
                modules={[EffectCoverflow, Navigation]}
                className="w-full"
            >
                {cards.map((card) => (
                    <SwiperSlide key={card.id} className="max-w-xs">
                        <div className="bg-white shadow-md rounded-lg overflow-hidden border">
                            {/* Image placeholder */}
                            <div className="bg-gray-200 h-40 flex items-center justify-center">
                                <span className="text-gray-500">Image</span>
                            </div>

                            {/* Content */}
                            <div className="p-4 text-left">
                                <p className="text-sm text-gray-500">{card.category}</p>
                                <h3 className="text-lg font-bold">{card.title}</h3>
                                <p className="text-gray-600 mt-2">
                                    Egestas elit dui scelerisque ut eu purus aliquam vitae habitasse.
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-2 mt-3">
                                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                                    <div>
                                        <p className="text-sm font-medium">{card.author}</p>
                                        <p className="text-xs text-gray-500">{card.role}</p>
                                    </div>
                                </div>

                                {/* Button */}
                                <button className="w-full bg-green-700 text-white py-2 px-4 rounded mt-4 hover:bg-green-800 transition">
                                    See More Details
                                </button>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default CardCarousel;
