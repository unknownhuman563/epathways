import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import QuickLeadForm from '@/components/ui/QuickLeadForm';

const PropertyDetails = ({ property }) => {
  const id = property?.id;
  const images = property?.images?.map((i) => i.url) ?? [];
  const money = (v) => (v == null ? null : `$${Number(v).toFixed(0)}`);

  const features = [
    { name: 'Room type', value: property?.room_type, cap: true },
    { name: 'Bed', value: property?.bed_type ? `${property.bed_type} mattress` : null, cap: true },
    { name: 'Wardrobe', value: property?.has_wardrobe ? 'Yes' : 'No' },
    { name: 'Bathroom', value: property?.bathroom_type, cap: true },
  ].filter((f) => f.value);

  return (
    <div className="bg-[#fafafa] min-h-screen font-urbanist text-black selection:bg-[#436235] selection:text-white">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <span className="px-3 py-1 bg-gray-100 text-xs font-bold uppercase tracking-wider rounded-full capitalize">{property?.room_type} room</span>
              {(property?.suburb || property?.location) && (
                <span className="text-sm text-gray-500 font-medium">{[property?.suburb, property?.location].filter(Boolean).join(' · ')}</span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">{property?.name}</h1>
            {property?.description && <p className="text-gray-500 text-lg">{property.description}</p>}
          </div>
        </div>

        {/* Image gallery */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[500px] md:h-[600px] mb-16">
            <div className="md:col-span-2 row-span-2 rounded-[2rem] overflow-hidden group">
              <img src={images[0]} alt="Main view" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            {images[1] && (
              <div className="rounded-[2rem] overflow-hidden group md:col-span-2 row-span-1">
                <img src={images[1]} alt="View 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            )}
            {images[2] && (
              <div className="rounded-[2rem] overflow-hidden group md:col-span-2 row-span-1">
                <img src={images[2]} alt="View 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="lg:w-2/3 space-y-12">
            {property?.includes && (
              <div>
                <h3 className="text-2xl font-bold mb-4">About this space</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{property.includes}</p>
              </div>
            )}

            <div>
              <h3 className="text-2xl font-bold mb-6">What this place offers</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex flex-col space-y-1 p-4 bg-gray-50 rounded-2xl">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{feature.name}</span>
                    <span className={`font-semibold ${feature.cap ? 'capitalize' : ''}`}>{feature.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="sticky top-28 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <span className="text-4xl font-bold">{money(property?.rent_single)}</span>
                  <span className="text-gray-500 ml-1">/ week</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-6">single occupant{property?.bills_excluded ? ' · excludes bills' : ''}</p>

              {property?.rent_couple != null && (
                <div className="border border-gray-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
                  <span className="text-sm text-gray-500">For a couple</span>
                  <span className="text-lg font-bold">{money(property.rent_couple)}<span className="text-xs text-gray-400 font-medium">/wk</span></span>
                </div>
              )}

              <a href={`/accommodation/expression-of-interest-hot?property=${encodeURIComponent([property?.name, property?.suburb].filter(Boolean).join(' — '))}`} className="w-full py-4 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20 text-center block">
                Interested? Click here
              </a>
              <p className="text-center text-xs text-gray-500 mt-4">We'll get back to you within 24 hours</p>
            </div>
          </div>
        </div>
      </main>

      {/* Soft capture — routed to sales as an Accommodation lead. */}
      <section id="inquire" className="bg-[#f7f8f6] py-14 sm:py-20 border-t border-gray-100 scroll-mt-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#436235] mb-2">Have questions before booking?</p>
            <h3 className="text-2xl md:text-3xl font-bold text-[#282728]">Talk to our accommodation team</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">Availability, group rates, student arrival support — leave a quick note and we'll be in touch within 24 hours.</p>
          </div>
          <QuickLeadForm
            source={`property-details:${id || 'unknown'}`}
            defaultInterest="Accommodation"
            variant="card"
            headline="Your details"
            subtext="No commitment. We never share your contact details."
          />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PropertyDetails;
