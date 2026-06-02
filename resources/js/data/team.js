import DevImg from "@assets/team/Dev.png";
import DinaImg from "@assets/team/dina.png";
import EmmaImg from "@assets/team/emma.png";
import DaiImg from "@assets/team/dai.png";
import EmilyImg from "@assets/team/emily.png";
import NovaImg from "@assets/team/nova.png";

// Single source of truth for team members shown on the "Team Behind" grid
// and their public digital-card profiles at /team/{slug}.
//
// links: a button renders only when its value is non-empty. WhatsApp is an
// E.164-style number in any format (non-digits are stripped for the wa.me link).
//
// NOTE: the link values + bios below are PLACEHOLDER / demo content so every
// button shows up. Replace each one with the person's real details.
export const team = [
  {
    slug: "david-bhageerutty",
    name: "David Bhageerutty",
    role: "Licence Immigration Adviser (Provisional) — 202401351",
    location: "New Zealand",
    image: DevImg,
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Guiding students and skilled migrants through every step of their New Zealand journey.",
    links: {
      booking: "https://calendly.com/epathways/david",
      whatsapp: "+64 21 555 0101",
      email: "david@epathways.co.nz",
      facebook: "https://facebook.com/epathways",
      linkedin: "https://linkedin.com/in/david-bhageerutty",
      wechatId: "ep-david",
    },
  },
  {
    slug: "dinah-suarin",
    name: "Dinah Suarin",
    role: "Co-Founding Member",
    location: "New Zealand",
    image: DinaImg,
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Building pathways that help people emerge, energise, and evolve.",
    links: {
      booking: "https://calendly.com/epathways/dinah",
      whatsapp: "+64 21 555 0102",
      email: "dinah@epathways.co.nz",
      facebook: "https://facebook.com/epathways",
      linkedin: "https://linkedin.com/in/dinah-suarin",
      wechatId: "ep-dinah",
    },
  },
  {
    slug: "emma-ceballo",
    name: "Emma Ceballo",
    role: "People Journey Experience Champion",
    location: "New Zealand",
    image: EmmaImg,
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Making sure every client feels supported from the first hello to arrival day.",
    links: {
      booking: "https://calendly.com/epathways/emma",
      whatsapp: "+64 21 555 0103",
      email: "emma@epathways.co.nz",
      facebook: "https://facebook.com/epathways",
      linkedin: "https://linkedin.com/in/emma-ceballo",
      wechatId: "ep-emma",
    },
  },
  {
    slug: "hendry-dai",
    name: "Hendry Dai",
    role: "Licence Immigration Adviser — IAA: 201500074",
    location: "New Zealand",
    image: DaiImg,
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Licensed immigration advice you can trust, with years of hands-on casework.",
    links: {
      booking: "https://calendly.com/epathways/hendry",
      whatsapp: "+64 21 555 0104",
      email: "hendry@epathways.co.nz",
      facebook: "https://facebook.com/epathways",
      linkedin: "https://linkedin.com/in/hendry-dai",
      wechatId: "ep-hendry",
    },
  },
  {
    slug: "emily-dela-pena",
    name: "Emily Dela Pena",
    role: "Finance Admin Champion",
    location: "New Zealand",
    image: EmilyImg,
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Keeping the numbers clear so your journey stays smooth and stress-free.",
    links: {
      booking: "https://calendly.com/epathways/emily",
      whatsapp: "+64 21 555 0105",
      email: "emily@epathways.co.nz",
      facebook: "https://facebook.com/epathways",
      linkedin: "https://linkedin.com/in/emily-dela-pena",
      wechatId: "ep-emily",
    },
  },
  {
    slug: "nova-palaca",
    name: "Nova Palaca",
    role: "Admin Champion",
    location: "New Zealand",
    image: NovaImg,
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. The behind-the-scenes engine keeping every application on track.",
    links: {
      booking: "https://calendly.com/epathways/nova",
      whatsapp: "+64 21 555 0106",
      email: "nova@epathways.co.nz",
      facebook: "https://facebook.com/epathways",
      linkedin: "https://linkedin.com/in/nova-palaca",
      wechatId: "ep-nova",
    },
  },
];

export const getMemberBySlug = (slug) =>
  team.find((member) => member.slug === slug) ?? null;
