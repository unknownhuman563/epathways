import React from 'react';
import Navbar from '../components/navigation-bar';
import Footer from '../components/footer';

const PropertyDetails = ({ id }) => {
  // In a real app, you would fetch data based on the ID. Using dummy data for now.
  const property = {
    title: "Premium Villa Selection",
    subtitle: "Luxurious stay with ocean views in Auckland",
    rating: 4.8,
    reviews: 124,
    location: "Auckland, New Zealand",
    price: "$250",
    description: "Experience the ultimate luxury in the heart of Auckland. This stunning premium villa offers breathtaking ocean views, state-of-the-art amenities, and a serene environment perfect for your summer vacations or extended stays. Designed with modern aesthetics and comfort in mind.",
    host: "Michael Doe",
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    features: [
      { name: "Total Rooms", value: "2 King + 1 Queen" },
      { name: "Bathrooms", value: "2 Attached" },
      { name: "Internet", value: "500Mbps High Speed" },
      { name: "Parking", value: "Yes Two Covered" },
      { name: "Kitchen", value: "Fully Equipped" },
      { name: "Pool", value: "Private Heated" },
    ]
  };

  return (
    <div className="bg-[#fafafa] min-h-screen font-urbanist text-black selection:bg-[#436235] selection:text-white">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        
        {/* Header section */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <span className="px-3 py-1 bg-gray-100 text-xs font-bold uppercase tracking-wider rounded-full">Top Rated</span>
              <div className="flex items-center space-x-1 text-sm font-semibold">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span>{property.rating} ({property.reviews} reviews)</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500 font-medium underline cursor-pointer">{property.location}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">{property.title}</h1>
            <p className="text-gray-500 text-lg">{property.subtitle}</p>
          </div>

          <div className="flex items-center space-x-4 shrink-0">
            <button className="flex items-center space-x-2 text-sm font-bold border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              <span>Share</span>
            </button>
            <button className="flex items-center space-x-2 text-sm font-bold border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[500px] md:h-[600px] mb-16">
          <div className="md:col-span-2 row-span-2 rounded-[2rem] overflow-hidden group">
            <img src={property.images[0]} alt="Main view" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
          <div className="rounded-[2rem] overflow-hidden group md:col-span-2 row-span-1">
            <img src={property.images[1]} alt="View 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
          <div className="rounded-[2rem] overflow-hidden group md:col-span-2 row-span-1">
            <img src={property.images[2]} alt="View 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Left info */}
          <div className="lg:w-2/3 space-y-12">
            
            {/* Host info */}
            <div className="flex justify-between items-center py-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold mb-1">Hosted by {property.host}</h3>
                <p className="text-sm text-gray-500">Superhost • 5 years hosting</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" alt="Host" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-2xl font-bold mb-4">About this space</h3>
              <p className="text-gray-600 leading-relaxed text-lg">{property.description}</p>
            </div>

            {/* Features Grid */}
            <div>
              <h3 className="text-2xl font-bold mb-6">What this place offers</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {property.features.map((feature, idx) => (
                  <div key={idx} className="flex flex-col space-y-1 p-4 bg-gray-50 rounded-2xl">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{feature.name}</span>
                    <span className="font-semibold">{feature.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="lg:w-1/3">
            <div className="sticky top-28 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <span className="text-4xl font-bold">{property.price}</span>
                  <span className="text-gray-500 ml-1">/ week</span>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
                <div className="flex border-b border-gray-200">
                  <div className="w-1/2 p-3 border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Check-in</div>
                    <div className="text-sm font-semibold">Add date</div>
                  </div>
                  <div className="w-1/2 p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Checkout</div>
                    <div className="text-sm font-semibold">Add date</div>
                  </div>
                </div>
                <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Guests</div>
                  <div className="text-sm font-semibold">1 guest</div>
                </div>
              </div>

              <a href={`/accommodation/${id}/checkout`} className="w-full py-4 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20 text-center block">
                Reserve
              </a>
              <p className="text-center text-xs text-gray-500 mt-4">You won't be charged yet</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyDetails;
