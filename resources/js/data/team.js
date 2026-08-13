import DevImg from "@assets/team/Dev.png";
import DinaImg from "@assets/team/dina.png";
import EmmaImg from "@assets/team/emma.png";
import DaiImg from "@assets/team/dai.png";

// To add a member's WeChat QR: drop the image in resources/assets/team/,
// import it here (e.g. `import DevWeChat from "@assets/team/dev-wechat.png";`),
// and set that member's `links.wechatQr` to it. The profile shows the QR
// (tap to enlarge); until a QR is set, it falls back to the WeChat ID + Copy.

// Single source of truth for team members shown on the "Team Behind" grid
// and their public digital-card profiles at /team/{slug}.
//
// links: a button renders only when its value is set. WhatsApp is an E.164-style
// number in any format (non-digits are stripped for the wa.me link).
//
// NOTE: values marked with TODO are PLACEHOLDER demo content — replace them.
export const team = [
  {
    slug: "david-bhageerutty",
    name: "Dev Bhageerutty",
    role: "Licence Immigration Adviser (Provisional) — 202401351",
    location: "New Zealand",
    image: DevImg,
    bio: "Guiding students and skilled migrants through every step of their New Zealand journey.",
    links: {
      booking: "https://calendar.app.google/FYfMdmB1HxfBs7A28",
      whatsapp: "+64 22 188 2800",
      email: "dev@epathways.co.nz",
      facebook: "https://www.facebook.com/dev.bhageerutty",
      linkedin: "https://linkedin.com/in/dev-bhageerutty", // TODO: replace with Dev's real LinkedIn URL
      wechatId: "ep-dev", // TODO: pending — replace with Dev's WeChat QR image (set wechatQr)
      wechatQr: null,
    },
  },
  {
    slug: "dinah-suarin",
    name: "Dinah Jabone",
    role: "Co-Founding Member",
    location: "New Zealand",
    image: DinaImg,
    bio: "Building pathways that help people emerge, energise, and evolve.",
    links: {
      booking: "https://calendar.app.google/NNorTcatG68Rjwd46",
      whatsapp: "+64 27 777 5586",
      email: "dinah@epathways.co.nz",
      facebook: "https://www.facebook.com/dinah.jabonesuarin",
      linkedin: "https://linkedin.com/in/dinah-suarin", // TODO: replace with Dinah's real LinkedIn URL
      wechatId: "ep-dinah", // TODO: pending — replace with Dinah's WeChat QR image (set wechatQr)
      wechatQr: null,
    },
  },
  {
    slug: "emma-ceballo",
    name: "Emma Ceballo",
    role: "People Journey Experience Champion",
    location: "New Zealand",
    image: EmmaImg,
    bio: "Making sure every client feels supported from the first hello to arrival day.",
    links: {
      booking: "https://calendly.com/epathways/emma", // TODO
      whatsapp: "+64 21 555 0103", // TODO
      email: "emma@epathways.co.nz", // TODO
      facebook: "https://facebook.com/epathways", // TODO
      linkedin: "https://linkedin.com/in/emma-ceballo", // TODO
      wechatId: "ep-emma", // TODO
      wechatQr: null,
    },
  },
  {
    slug: "hendry-dai",
    name: "Hendry Dai",
    role: "Licence Immigration Adviser — IAA: 201500074",
    location: "New Zealand",
    image: DaiImg,
    bio: "Licensed immigration advice you can trust, with years of hands-on casework.",
    links: {
      booking: "https://calendly.com/epathways/hendry", // TODO
      whatsapp: "+64 21 555 0104", // TODO
      email: "hendry@epathways.co.nz", // TODO
      facebook: "https://facebook.com/epathways", // TODO
      linkedin: "https://linkedin.com/in/hendry-dai", // TODO
      wechatId: "ep-hendry", // TODO
      wechatQr: null,
    },
  },
];

export const getMemberBySlug = (slug) =>
  team.find((member) => member.slug === slug) ?? null;
