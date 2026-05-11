import React from "react";
import Logo from "@assets/newlogosite.png";
import IcefLogo from "@assets/about_us/icef.png";
import { Instagram, Facebook, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="font-urbanist">
      {/* Main Footer Section - White Background */}
      <div className="bg-white text-black py-20 px-6 md:px-12 lg:px-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10 md:gap-4 lg:gap-10">

          <div className="md:w-1/4">
            <div className="flex flex-col items-center md:items-start space-y-8">
              <a href="/" className="block w-48">
                <img src={Logo} alt="ePathways Logo" className="w-full" />
              </a>
              <div className="w-72">
                <img src={IcefLogo} alt="ICEF Logo" className="w-full" />
              </div>
              <div className="flex space-x-5 text-gray-800">
                <a href="https://instagram.com/nz.epathways" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                  <Instagram size={24} strokeWidth={1.5} />
                </a>
                <a href="#" className="hover:text-green-600 transition-colors">
                  <Facebook size={24} strokeWidth={1.5} />
                </a>
                <a href="#" className="hover:text-green-600 transition-colors">
                  <Linkedin size={24} strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Education */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Education</h3>
            <ul className="space-y-4 text-gray-600 text-sm font-medium">
              <li><a href="/programs-levels" className="hover:text-green-600 transition-colors">Program and Levels</a></li>
              <li><a href="/fee-guide" className="hover:text-green-600 transition-colors">Fee Guide</a></li>
            </ul>
          </div>

          {/* Column 3: Immigration */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Immigration</h3>
            <ul className="space-y-4 text-gray-600 text-sm font-medium">
              <li><a href="#" className="hover:text-green-600 transition-colors">Program and Levels</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Requirement</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Benefits</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Pricelist</a></li>
            </ul>
          </div>

          {/* Column 4: Accommodation */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Accomodation</h3>
            <ul className="space-y-4 text-gray-600 text-sm font-medium">
              <li><a href="#" className="hover:text-green-600 transition-colors">Program and Levels</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Requirement</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Benefits</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Pricelist</a></li>
            </ul>
          </div>

          {/* Column 5: Contact Us */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Contact us</h3>
            <div className="space-y-6 text-gray-600 text-sm font-medium">
              <div>
                <p className="font-bold text-black mb-1">Call :</p>
                <a href="tel:+64277775586" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  +64 27 777 5586
                </a>
              </div>

              <div>
                <p className="font-bold text-black mb-1">Email :</p>
                <a href="mailto:info@epathways.co.nz" className="hover:text-green-600 transition-colors flex items-center gap-2">
                  info@epathways.co.nz
                </a>
              </div>

              <div>
                <p className="font-bold text-black mb-1">Location :</p>
                <p>Auckland, New Zealand</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar - Dark Background */}
      <div className="bg-[#282728] text-white py-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="flex space-x-6 mb-4 md:mb-0">
            <a href="#" className="hover:text-green-400 transition-colors">Privacy Policy</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:text-green-400 transition-colors">Our History</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:text-green-400 transition-colors">What We Do</a>
          </div>
          <div className="text-gray-500">
            © {currentYear} ePathways. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
