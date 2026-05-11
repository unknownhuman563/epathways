import React from "react";
import Herodash from "@assets/Herodash.png";
import Herodash2 from "@assets/p2hero.png"
import { Carousel } from "flowbite-react";

const HeroLarge = () => {
    return (
        <div className="relative w-full h-150 md:h-96">
            <Carousel slideInterval={5000} indicators={true}>
                <div>
                    <img
                        src={Herodash}
                        alt="Slide 1"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
             
                    <img
                        src={Herodash2}
                        alt="Slide 2"
                        className="w-full h-full object-cover"
                    />
                </div>

            </Carousel>
        </div>


    );
}

export default HeroLarge;
