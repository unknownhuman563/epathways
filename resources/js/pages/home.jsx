import React, { useEffect, useState } from "react";
import Navbar from "@/components/navigation-bar";
import HeroSection from "@/components/HeroSection";
import StatisticsBar from "@/components/StatisticsBar";
import ServicesGrid from "@/components/ServicesGrid";
import InDemandPrograms from "@/components/InDemandPrograms";
import StudentVisaTimeline from "@/components/StudentVisaTimeline";
import EventsAnnouncements from "@/components/EventsAnnouncements";
import SuccessStories from "@/components/SuccessStories";
import WhyUs from "@/components/WhyUs";
import ProcessSteps from "@/components/ProcessSteps";
import PartnerLogos from "@/components/partners";
import AboutBrief from "@/components/AboutBrief";
import ScrollToTop from "@/components/scrolltotop";
import Modal from "@/components/modal-component";
import Footer from "../components/footer";
import CTASection from "@/components/CTASection";
import AccreditationSection from "@/components/AccreditationSection";
import VisaApprovedShowcase from "@/components/VisaApprovedShowcase";


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

        {/* About Brief Section */}
        <AboutBrief />
        <AccreditationSection />

        {/* Services Section */}
        <section id="services">
          <ServicesGrid />
        </section>

        <WhyUs />
        <ProcessSteps />
        <VisaApprovedShowcase />


        {/* In-Demand Programs Section */}
        <InDemandPrograms />

        {/* Student Visa Timeline Section */}
        <StudentVisaTimeline />

        {/* Success Stories Section */}
        <SuccessStories />

        {/* CTA Section */}
        <CTASection />

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
