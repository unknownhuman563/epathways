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
import BeforeFooterCTA from "@/components/ui/BeforeFooterCTA";
import Footer from "@/components/layout/Footer";
import CTASection from "./CTASection";
import AccreditationSection from "./AccreditationSection";
import VisaApprovedShowcase from "./VisaApprovedShowcase";
import PromoBanner from "@/components/ui/PromoBanner";
import PromoModal from "@/components/ui/PromoModal";
import ReviewsSection from "@/components/ui/ReviewsSection";

import HeroVideo from "@assets/Hero/02 - client epathway intro (1).mp4";

export default function Home({ events = [], programGroups = [], activePromos = [], reviews = [], reviewStats = { count: 0, average: 0 } }) {
  return (
    <>
      <div className="bg-white" style={{ overflowX: 'clip' }}>
        <Navbar />

        {/* Live promo strip — renders nothing if no promos are active */}
        <PromoBanner promos={activePromos} variant="strip" />

        {/* Hero Section — knows about the promo strip so it can reserve
            the right amount of vertical room without leaving a blank band. */}
        <HeroSection backgroundVideo={HeroVideo} hasPromo={activePromos.length > 0} />

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

        {/* Student Visa Timeline Section — moved above Visa Approvals so
            the journey timeline frames the approval stories. */}
        <StudentVisaTimeline />

        <VisaApprovedShowcase />

        {/* In-Demand Programs Section */}
        <InDemandPrograms programGroups={programGroups} />

        {/* Success Stories Section — hidden, superseded by the live
            client-reviews section below which pulls from real published
            reviews instead of the hard-coded Kent Dinfer testimonial. */}
        {/* <SuccessStories /> */}

        {/* All client reviews — merges immigration + education reviews into
            one feed. Read-only on home (no "Write a review" CTA) since the
            submission flow lives on each dept page so reviews get tagged
            correctly. */}
        <ReviewsSection
            reviews={reviews}
            stats={reviewStats}
            eyebrow="Client reviews"
            headline="What our clients say"
            intro="Real voices from people across our immigration and education journeys. Every review here was submitted by a real client and approved by our team."
            showWriteCta={false}
        />

        {/* CTA Section */}
        <CTASection />

        {/* Events and Announcements Section */}
        <EventsAnnouncements events={events} />

        {/* Single premium soft-capture, mounted just above the footer.
            Replaces the previously-modal exit-intent prompt. */}
        <BeforeFooterCTA source="home-beforefooter" />

        <ScrollToTop />

        {/* Promo Modal — auto-opens once per week when there are live promos,
            and is the target of the strip's "+N more" pill. Dismissing it
            also suppresses the Welcome modal for the same visit. */}
        <PromoModal promos={activePromos} />

        {/* Welcome Modal (shows at most once per visitor per week) */}
        <Modal />

        <Footer />
      </div>
    </>
  );
}
