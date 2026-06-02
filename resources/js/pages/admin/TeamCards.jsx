import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import { team } from "@/data/team";

// Builds the absolute profile URL so the encoded QR is correct per environment
// (localhost / staging / production). origin is read at click/render time.
const profileUrl = (slug) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/team/${slug}`;

function MemberCard({ member }) {
  const ref = useRef(null);

  const download = () => {
    const canvas = ref.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${member.slug}-qr.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div ref={ref} className="rounded-xl bg-white p-3">
        <QRCodeCanvas value={profileUrl(member.slug)} size={180} level="M" includeMargin />
      </div>
      <h3 className="mt-4 text-center text-base font-bold text-[#282728]">{member.name}</h3>
      <p className="text-center text-xs text-gray-500">{member.role}</p>
      <a
        href={`/team/${member.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 break-all text-center text-[11px] text-[#436235] underline"
      >
        /team/{member.slug}
      </a>
      <button
        type="button"
        onClick={download}
        className="mt-4 flex items-center gap-2 rounded-xl bg-[#436235] px-4 py-2 text-sm font-semibold text-white"
      >
        <Download className="h-4 w-4" /> Download PNG
      </button>
    </div>
  );
}

export default function TeamCards() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#282728]">Team Calling-Card QR Codes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Each QR links to that person's public profile. Download and place a single QR on the printed card.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {team.map((member) => (
          <MemberCard key={member.slug} member={member} />
        ))}
      </div>
    </div>
  );
}
