import React from 'react';

const CTASection = () => {
  return (
    <section className="relative w-full py-24 flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/coffee-cta.png" 
          alt="CTA Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal text-white leading-tight font-urbanist drop-shadow-md">
            Ready to take the next step
          </h2>
        </div>
        
        <div className="flex flex-col md:pl-12 lg:pl-20">
          <p className="text-lg md:text-xl text-white mb-6 font-normal drop-shadow-md font-urbanist">
            Let's talk about your future and what's possible for you.
          </p>
          <div className="flex space-x-4">
            <a 
              href="/booking" 
              className="px-8 py-3 bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors duration-300 font-urbanist"
            >
              Book
            </a>
            <a 
              href="/free-assessment" 
              className="px-8 py-3 bg-[#111] bg-opacity-70 border border-gray-500 text-white text-sm font-semibold hover:bg-opacity-90 hover:border-gray-400 transition-colors duration-300 font-urbanist"
            >
              Apply
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
