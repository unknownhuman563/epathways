import React, { useEffect, useState } from "react";
import Navbar from "@/components/navigation-bar";
import HeroSection from "@/components/HeroSection";
import StatisticsBar from "@/components/StatisticsBar";
import ServicesGrid from "@/components/ServicesGrid";
import ThreePillars from "@/components/ThreePillars";
import HowItHelps from "@/components/HowItHelps";
import InDemandPrograms from "@/components/InDemandPrograms";
import VisaProcessSteps from "@/components/VisaProcessSteps";
import EventsAnnouncements from "@/components/EventsAnnouncements";
import SuccessStories from "@/components/SuccessStories";
import LearnAbout from "@/components/LearnAbout";
import PartnerLogos from "@/components/partners";
import ScrollToTop from "@/components/scrolltotop";
import Modal from "@/components/modal-component";
import Footer from "../components/footer";

import HeroVideo from "@assets/Hero/02 - client epathway intro (1).mp4";

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(true);
  }, []);

  return (
    <>
      <div className="bg-white" style={{ overflowX: 'clip' }}>
        <Navbar />

        {/* Hero Section */}
        <HeroSection backgroundVideo={HeroVideo} />

        {/* Statistics Bar */}
        <StatisticsBar />

        {/* Partner Logos */}
        <section>
          <PartnerLogos />
        </section>

        {/* Services Section */}
        <section id="services">
          <ServicesGrid />
        </section>

        {/* 3 Pillars Section */}
        <ThreePillars />

        {/* In-Demand Programs Section */}
        <InDemandPrograms />

        {/* Visa Process Steps Section */}
        <VisaProcessSteps />

        {/* Success Stories Section */}
        <SuccessStories />

        {/* Learn About Section */}
        <LearnAbout />

        {/* Events and Announcements Section */}
        <EventsAnnouncements />

        <ScrollToTop />

        {/* Welcome Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} />

        <Footer />
      </div>
    </>
  );
}
