import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const Accommodation = () => {
  const [activeTab, setActiveTab] = useState('Villa');

  const tabs = ['Villa', 'Apartments', 'Mansion', 'Cottage'];

  const accommodations = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      rating: 4.5,
      title: "DIVI PIXEL LAYOUT PACK",
      subtitle: "Best option to stay here for your summer vacations",
      price: "$140",
      rooms: "1 King + 2",
      bathrooms: "3 Attached",
      internet: "100Mbps",
      parking: "Yes Two",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      rating: 4.5,
      title: "DIVI PIXEL LAYOUT PACK",
      subtitle: "Best option to stay here for your summer vacations",
      price: "$180",
      rooms: "1 King + 2",
      bathrooms: "3 Attached",
      internet: "100Mbps",
      parking: "Yes Two",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      rating: 4.8,
      title: "PREMIUM VILLA SELECTION",
      subtitle: "Luxurious stay with ocean views in Auckland",
      price: "$250",
      rooms: "2 King + 1 Queen",
      bathrooms: "2 Attached",
      internet: "500Mbps",
      parking: "Yes Two",
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      rating: 4.7,
      title: "COZY CITY APARTMENT",
      subtitle: "Heart of the city center with easy access",
      price: "$120",
      rooms: "1 Queen",
      bathrooms: "1 Attached",
      internet: "100Mbps",
      parking: "None",
    }
  ];

  return (
    <div className="bg-[#fafafa] min-h-screen font-urbanist text-black">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left Content */}
          <div className="lg:w-5/12 space-y-8">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold text-sm">4.5 Rating</span>
              <span className="text-gray-500 text-sm">by New York Times</span>
            </div>

            <h1 className="text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Find out the<br />Best stay.
            </h1>

            <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
              Your content goes here. Edit or remove this text inline or in the module Content settings. You can also style every aspect of this content in the module Design.
            </p>

            <div className="flex items-center space-x-4 pt-2">
              <button className="px-8 py-3.5 bg-gray-200/60 hover:bg-gray-200 text-black rounded-full text-sm font-bold transition-colors">
                Log in
              </button>
              <button className="px-8 py-3.5 bg-black hover:bg-gray-800 text-white rounded-full text-sm font-bold transition-colors flex items-center space-x-2">
                <span>Get Started</span>
              </button>
            </div>

            <div className="pt-10">
              <p className="text-[10px] font-bold text-gray-500 mb-4">Trusted by</p>
              <div className="flex items-center gap-6 opacity-50 flex-wrap">
                 <span className="font-bold text-lg tracking-tight flex items-center gap-1">
                     <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center text-white text-[8px] font-black">S</div>
                     Samsonite
                 </span>
                 <span className="font-bold text-xl tracking-tighter flex items-center gap-1">
                    <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                    airbnb
                 </span>
                 <span className="font-bold text-lg tracking-wider">Emirates</span>
                 <span className="font-bold text-sm tracking-tight"><span className="text-blue-600">United</span>travel</span>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:w-7/12">
            <img 
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Beautiful living room" 
              className="w-full h-[550px] object-cover rounded-[2.5rem]"
            />
          </div>
        </div>
      </section>

      {/* Grid Images Section */}
      <section className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-4 cursor-pointer group">
            <div className="relative rounded-[2rem] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1540518614846-7eded433c457?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Room 1" className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-full backdrop-blur-sm">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </div>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="font-bold text-xs">3BHK Flat</span>
              <span className="text-gray-400 text-[10px] font-medium">Auckland, New Zealand</span>
            </div>
          </div>
          
          <div className="space-y-4 cursor-pointer group">
            <div className="relative rounded-[2rem] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1554995207-c18c203602cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Room 2" className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-full backdrop-blur-sm">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </div>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="font-bold text-xs">3BHK Flat</span>
              <span className="text-gray-400 text-[10px] font-medium">Auckland, New Zealand</span>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-4 p-4 pl-8">
            <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">Divi Pixel Layout Pack</p>
            <h3 className="text-xl font-bold leading-snug">Best option to stay here for your summer vacations</h3>
            <div className="pt-4">
                <a href="/accommodation/1" className="flex items-center space-x-2 text-xs font-bold w-fit hover:text-gray-600 transition-colors group">
                  <span>Explore More</span>
                  <div className="bg-black text-white p-1 rounded-full group-hover:scale-110 transition-transform">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                </a>
            </div>
          </div>

          <div className="rounded-[2rem] overflow-hidden">
             <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" className="w-full h-64 object-cover" alt="Room 3" />
          </div>
        </div>
      </section>

      {/* Amenities Overview Section */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <p className="text-[10px] font-bold tracking-[0.3em] text-gray-400 mb-6 uppercase">Why Choose Us</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16">Premium Amenities for Your Comfort</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              </div>
              <h3 className="text-xl font-bold">Prime Locations</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">All our properties are situated in the heart of Auckland, giving you easy access to the best attractions.</p>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h3 className="text-xl font-bold">High Security</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">We ensure your safety with 24/7 surveillance and smart lock systems in all our premium accommodations.</p>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
              </div>
              <h3 className="text-xl font-bold">Daily Cleaning</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">Enjoy hotel-like services with our professional daily housekeeping, ensuring your stay is always pristine.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Accommodation Section */}
      <section className="container mx-auto px-4 py-24 max-w-7xl text-center" id="accommodation">
        <p className="text-[10px] font-bold tracking-[0.3em] text-gray-400 mb-6 uppercase">Accommodation Layout Pack</p>
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-16">accommodation</h2>

        {/* Tabs */}
        <div className="flex justify-center mb-16 overflow-x-auto">
          <div className="flex space-x-2 bg-gray-50/80 p-1.5 rounded-2xl">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-12 py-4 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] text-black' 
                    : 'text-gray-400 hover:text-black'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* List of Properties */}
        <div className="space-y-8 text-left">
          {accommodations.map((acc) => (
            <div key={acc.id} className="bg-white rounded-[2rem] p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 items-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow">
              
              {/* Column 1: Image */}
              <div className="relative w-full h-64 lg:h-full min-h-[260px]">
                <img src={acc.image} alt="Room" className="w-full h-full object-cover rounded-[1.5rem]" />
                <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-sm">
                  <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <span className="text-sm font-bold">{acc.rating}</span>
                </div>
              </div>

              {/* Column 2: Title */}
              <div className="flex flex-col justify-between h-full py-4 lg:pr-8 lg:border-r border-gray-100">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-4 uppercase">{acc.title}</p>
                  <h3 className="text-xl font-bold leading-snug">{acc.subtitle}</h3>
                </div>
                <div className="flex items-center space-x-2 text-xs font-bold cursor-pointer group w-fit mt-12">
                  <span>Meet the Host</span>
                  <div className="bg-gray-100 text-black p-1.5 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Column 3: Price & Info */}
              <div className="h-full py-4 lg:px-8 lg:border-r border-gray-100">
                <div className="mb-8">
                  <h4 className="text-3xl font-bold">{acc.price}<span className="text-sm text-gray-400 font-medium">/week</span></h4>
                  <p className="text-[10px] text-gray-400 mt-1">including all taxes</p>
                </div>
                
                <p className="text-[11px] font-bold mb-4">Basic Information</p>
                
                <div className="space-y-3 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Rooms</span>
                    <span className="font-semibold text-gray-400">{acc.rooms}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Bathrooms</span>
                    <span className="font-semibold text-gray-400">{acc.bathrooms}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Internet</span>
                    <span className="font-semibold text-gray-400">{acc.internet}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Covered Parking</span>
                    <span className="font-semibold text-gray-400">{acc.parking}</span>
                  </div>
                </div>
              </div>

              {/* Column 4: Amenities & Book */}
              <div className="flex flex-col justify-between h-full py-4 lg:pl-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2.5 border border-gray-200 rounded-xl shrink-0">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm mb-1">Cleanliness</h5>
                      <p className="text-[10px] text-gray-400 leading-relaxed">Lorem ipsum dolor sit ametony, consectetur adinliteger pt nea.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="p-2.5 border border-gray-200 rounded-xl shrink-0">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm mb-1">Amenities</h5>
                      <p className="text-[10px] text-gray-400 leading-relaxed">Lorem ipsum dolor sit ametony, consectetur adinliteger pt nea.</p>
                    </div>
                  </div>
                </div>

                <a href={`/accommodation/${acc.id}`} className="w-full mt-8 py-4 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20 text-center block">
                  Book Now!
                </a>
              </div>

            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Accommodation;
