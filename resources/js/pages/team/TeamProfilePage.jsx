import { useState } from "react";
import { Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Calendar,
  MessageCircle,
  Mail,
  Facebook,
  Linkedin,
  Copy,
  Check,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactButton from "@/pages/team/ContactButton";
import { getMemberBySlug } from "@/data/team";

// Keep only digits for the wa.me link (accepts "+64 21 000 0000" etc.).
const waNumber = (raw) => (raw || "").replace(/\D/g, "");

export default function TeamProfilePage({ slug }) {
  const member = getMemberBySlug(slug);
  const [copied, setCopied] = useState(false);

  if (!member) {
    return (
      <div className="min-h-screen bg-[#f7f8f6] font-urbanist">
        <Navbar />
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#436235]">
            ePathways
          </span>
          <h1 className="mb-3 text-4xl font-bold text-[#282728]">Profile not found</h1>
          <p className="mb-8 max-w-sm text-gray-500">
            We couldn't find that team member — they may have moved on or the link is incorrect.
          </p>
          <Link
            href="/about-us"
            className="inline-flex items-center gap-2 rounded-xl bg-[#436235] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#37501f]"
          >
            <ArrowLeft className="h-4 w-4" /> Meet the team
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { name, role, image, location, bio, links } = member;

  const copyWeChat = async () => {
    try {
      await navigator.clipboard.writeText(links.wechatId);
      setCopied(true);
      toast.success("WeChat ID copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — long-press to copy: " + links.wechatId);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8f6] font-urbanist">
      <Navbar />

      <section className="relative flex justify-center overflow-hidden px-4 pb-24 pt-28">
        {/* Soft brand glow backdrop */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#436235]/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[#436235]/5 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-4xl"
        >
          <Link
            href="/about-us"
            className="mb-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 transition-colors hover:text-[#436235]"
          >
            <ArrowLeft className="h-4 w-4" /> Meet the team
          </Link>

          <div className="grid overflow-hidden rounded-[28px] bg-white shadow-[0_30px_70px_-25px_rgba(40,39,40,0.45)] ring-1 ring-black/5 md:grid-cols-2">
            {/* Left — photo */}
            <div className="relative h-72 md:h-auto">
              <img src={image} alt={name} className="absolute inset-0 h-full w-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/5" />
              {location ? (
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                  <MapPin className="h-3 w-3" /> {location}
                </span>
              ) : null}
            </div>

            {/* Right — details + actions */}
            <div className="flex flex-col p-8 md:p-10">
              <h1 className="text-2xl font-extrabold uppercase leading-tight tracking-tight text-[#282728] md:text-3xl">
                {name}
              </h1>
              <div className="mt-3 h-0.5 w-10 bg-[#436235]" />
              <p className="mt-3 text-[11px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-[#436235]">
                {role}
              </p>

              {bio ? <p className="mt-5 text-sm leading-relaxed text-gray-500">{bio}</p> : null}

              <div className="mt-7 space-y-3">
                {links.booking ? (
                  <ContactButton
                    primary
                    icon={Calendar}
                    label="Book a Consultation"
                    sublabel="Schedule a free call"
                    href={links.booking}
                    external
                  />
                ) : null}

                {/* Socials — 2-column grid */}
                <div className="grid grid-cols-2 gap-3">
                  {links.whatsapp ? (
                    <ContactButton
                      compact
                      icon={MessageCircle}
                      label="WhatsApp"
                      href={`https://wa.me/${waNumber(links.whatsapp)}`}
                      external
                    />
                  ) : null}
                  {links.email ? (
                    <ContactButton compact icon={Mail} label="Email" href={`mailto:${links.email}`} />
                  ) : null}
                  {links.facebook ? (
                    <ContactButton compact icon={Facebook} label="Facebook" href={links.facebook} external />
                  ) : null}
                  {links.linkedin ? (
                    <ContactButton compact icon={Linkedin} label="LinkedIn" href={links.linkedin} external />
                  ) : null}
                </div>

                {links.wechatId ? (
                  <div className="rounded-2xl border border-gray-200/80 bg-white px-5 py-4">
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#436235]/10 text-base font-extrabold text-[#436235]">
                        微
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-bold tracking-tight text-[#282728]">
                          WeChat
                        </span>
                        <span className="block truncate text-xs text-gray-400">{links.wechatId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={copyWeChat}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#436235]/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#436235] transition-colors hover:bg-[#436235] hover:text-white"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">
                <span className="h-px w-6 bg-gray-200" />
                ePathways
                <span className="h-px flex-1 bg-gray-200" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
