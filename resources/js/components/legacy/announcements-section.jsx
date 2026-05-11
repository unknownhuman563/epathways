import CarouselHeader from "@/components/events-carousel"

const slides = [
     {
        image: new URL("@assets/Events/sb19.png", import.meta.url).href,
        title: "We’re thrilled to announce that ePathways is the Official Visa Servicing Partner of JNR8 Productions  Events in New Zealand! 🇳🇿✨",
        description: "As part of this collaboration, we’re proud to support SB19: Simula at Wakas World Tour in – Auckland, New Zealand, bringing world-class entertainment to Filipinos abroad. 🥂 Join us on 12 December 2025 at The Trusts Arena, Auckland, and witness SB19 light up the stage like never before!",
        urlref:"https://www.facebook.com/share/p/1GizDhA4Qo/"
    },
    {
        image: new URL("@assets/Events/garyv.jpg", import.meta.url).href,
        title: "ePathways has processed the visas for The Pure Energy Gary V and crew and all got approved!",
        description: "Music icon 𝗚𝗮𝗿𝘆 𝗩𝗮𝗹𝗲𝗻𝗰𝗶𝗮𝗻𝗼 𝗮𝗻𝗱 𝗵𝗶𝘀 𝗰𝗼𝗻𝗰𝗲𝗿𝘁 𝘁𝗲𝗮𝗺 are officially set to take the stage in Australia and New Zealand — their visas have been approved! ✈️✨ This approval was powered by the unstoppable ePathways Team, collaborating in perfect sync with our incredible partner, Seek Migration. We make the impossible possible — delivering fast, reliable, and stress-free immigration solutions.",
        urlref:"https://www.facebook.com/share/p/1GizDhA4Qo/"
    },
    {
        image: new URL("@assets/Events/studenthours.jpg", import.meta.url).href,
        title: "Thinking of renewing your visa? Get your 25 hours now! ",
        description: "Starting November 3, 2025, New Zealand Immigration announced that international students can work up to 25 hours per week while studying — offering more flexibility and opportunities to grow. If your visa still shows the 20-hour limit, don’t worry — update or renew it easily with ePathways! Make every hour count and elevate your student journey with ePathways. ✨💚 Ready to start yours?",
        urlref:"https://www.facebook.com/share/p/19iDhJ8T7G/"
    },
    {
        image: new URL("@assets/Events/newrights.jpg", import.meta.url).href,
        title: "Upcoming Changes to Student Visa Work Rights",
        description: "New Rules, Bigger Opportunities for International Students! ✨",
        urlref:"https://www.immigration.govt.nz/about-us/news-centre/immigration-new-zealand-releases-2025-estimate-of-number-of-people-who-have-overstayed-their-visa/"
    },
    {
        image: new URL("@assets/Events/immigration.png", import.meta.url).href,
        title: "New Zealand Immigration News",
        description: "Read the latest immagration news to keep yourself updated on the current happening with New Zealand Visa",
        urlref:"https://www.immigration.govt.nz/about-us/news-centre/"
    }
]


const AnnouncementSection = () => {
    return (
        <section className="bg-gray-100 py-10 px-4 font-urbanist">
            {/* Heading */}
            <div className="text-center max-w-3xl mx-auto mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    Events and Announcements
                </h1>
                <p className="mt-4 text-sm sm:text-base text-gray-600">
                    Stay informed with the latest updates, opportunities, and important announcements about living, working, and studying in New Zealand
                </p>
            </div>

            {/* Announcement Card */}
            <CarouselHeader slides={slides} />

            {/* Button */}
            <div className="flex justify-center mt-8">
                <a href="https://www.facebook.com/epathwaysnz" className="bg-gray-800 hover:bg-gray-600 cursor-pointer text-white font-semibold px-6 py-2 rounded" target="_blank">
                    See More Events
                </a>
            </div>
        </section>
    );
};

export default AnnouncementSection;
