import React from "react";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "./HeroSection";
import StatisticsBar from "./StatisticsBar";
import ServicesGrid from "./ServicesGrid";
import InDemandPrograms from "./InDemandPrograms";
import StudentVisaTimeline from "./StudentVisaTimeline";
import EventsAnnouncements from "./EventsAnnouncements";
import SuccessStories from "./SuccessStories";
import WhyUs from "./WhyUs";
import ProcessSteps from "./ProcessSteps";
import PartnerLogos from "./PartnerLogos";
import AboutBrief from "./AboutBrief";
import ScrollToTop from "@/components/ui/ScrollToTop";
import Modal from "@/components/ui/Modal";
import Footer from "@/components/layout/Footer";
import CTASection from "./CTASection";
import AccreditationSection from "./AccreditationSection";
import VisaApprovedShowcase from "./VisaApprovedShowcase";

import HeroVideo from "@assets/Hero/02 - client epathway intro (1).mp4";

export default function Home({ events = [], programGroups = [] }) {
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
        <InDemandPrograms programGroups={programGroups} />

        {/* Student Visa Timeline Section */}
        <StudentVisaTimeline />

        {/* Success Stories Section */}
        <SuccessStories />

        {/* CTA Section */}
        <CTASection />

        {/* Events and Announcements Section */}
        <EventsAnnouncements events={events} />

        <ScrollToTop />

        {/* Welcome Modal (shows at most once per visitor per week) */}
        <Modal />

        <Footer />
      </div>
    </>
  );
}
