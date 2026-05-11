import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const Checkout = ({ id }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Dummy property data
  const property = {
    title: "Premium Villa Selection",
    rating: 4.8,
    reviews: 124,
    pricePerWeek: 250,
    image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
  };

  const weeks = 3;
  const subtotal = property.pricePerWeek * weeks;
  const serviceFee = 45;
  const taxes = 35;
  const total = subtotal + serviceFee + taxes;

  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="bg-[#fafafa] min-h-screen font-urbanist text-black flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-12 rounded-[2rem] shadow-lg text-center max-w-md w-full">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-3xl font-bold mb-4">Payment Successful!</h2>
            <p className="text-gray-500 mb-8">Your reservation for {property.title} has been confirmed. A receipt has been sent to your email.</p>
            <a href="/accommodation" className="inline-block w-full py-4 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors">
              Return to Accommodations
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] min-h-screen font-urbanist text-black">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex items-center space-x-4 mb-8">
            <a href={`/accommodation/${id}`} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </a>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Confirm and pay</h1>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-12 lg:gap-16">
          
          {/* Left Column: Payment Details */}
          <div className="lg:w-3/5 space-y-10">
            
            <section>
                <h2 className="text-2xl font-bold mb-6">Your trip</h2>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold">Dates</h3>
                        <p className="text-gray-500 text-sm">Oct 12 - Oct 15</p>
                    </div>
                    <button className="text-sm font-bold underline cursor-pointer hover:text-gray-600">Edit</button>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold">Guests</h3>
                        <p className="text-gray-500 text-sm">1 guest</p>
                    </div>
                    <button className="text-sm font-bold underline cursor-pointer hover:text-gray-600">Edit</button>
                </div>
            </section>

            <hr className="border-gray-200" />

            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Pay with</h2>
                    <div className="flex space-x-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                    </div>
                </div>

                <form onSubmit={handlePayment} className="space-y-6">
                    {/* Card inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">Card Number</label>
                            <div className="relative">
                                <input type="text" placeholder="0000 0000 0000 0000" required className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all" />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">Expiration</label>
                                <input type="text" placeholder="MM/YY" required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">CVC</label>
                                <input type="text" placeholder="123" required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Name on Card</label>
                            <input type="text" placeholder="John Doe" required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all" />
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    <div className="text-sm text-gray-500 leading-relaxed">
                        By selecting the button below, I agree to the House Rules, Ground Rules for Guests, and the Accommodation Refund Policy. I understand my payment will be securely processed.
                    </div>

                    <button 
                        type="submit" 
                        disabled={isProcessing}
                        className={`w-full py-4 text-white rounded-full font-bold shadow-lg flex items-center justify-center transition-all ${isProcessing ? 'bg-gray-600 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}
                    >
                        {isProcessing ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : null}
                        <span>{isProcessing ? 'Processing...' : `Confirm and pay $${total}`}</span>
                    </button>
                </form>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:w-2/5">
            <div className="sticky top-28 bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                    <img src={property.image} alt={property.title} className="w-24 h-24 object-cover rounded-xl shrink-0" />
                    <div>
                        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Entire Villa</p>
                        <h3 className="font-bold text-lg leading-tight mb-1">{property.title}</h3>
                        <div className="flex items-center text-xs font-semibold">
                            <svg className="w-3 h-3 text-black mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            <span>{property.rating} <span className="text-gray-400 font-normal">({property.reviews} reviews)</span></span>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-bold mb-4">Price details</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">${property.pricePerWeek} x {weeks} weeks</span>
                            <span className="font-semibold">${subtotal}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 underline">Service fee</span>
                            <span className="font-semibold">${serviceFee}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 underline">Taxes</span>
                            <span className="font-semibold">${taxes}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-lg">Total (USD)</span>
                    <span className="font-bold text-xl">${total}</span>
                </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
