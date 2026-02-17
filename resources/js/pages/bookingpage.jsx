// resources/js/Pages/bookingpage.jsx
import React, { useState } from "react";
import Navbar from "@/components/navigation-bar";
import { CountryDropdown, RegionDropdown } from "react-country-region-selector";

export default function BookingPage() {
    const [country, setCountry] = useState("");
    const [region, setRegion] = useState("");
    return (
        <>
            <Navbar />
            <div className="max-w-3xl mx-auto p-6">
                <h1 className="text-2xl font-bold text-gray-800">Book a Consultation</h1>
                <p className="mt-2 text-gray-600">Fill out the form below to schedule your consultation.</p>

                {/* booking form here */}
                <form className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <input type="text" placeholder="Last Name" className="w-full border p-2 rounded" />
                    <input type="text" placeholder="First Name" className="w-full border p-2 rounded" />
                    <input type="text" placeholder="Middle Name" className="w-full border p-2 rounded" />

                    {/* Full width fields */}
                    <input type="email" placeholder="Email Address" className="w-full border p-2 rounded sm:col-span-2" />
                    <input type="tel" placeholder="Phone Number" className="w-full border p-2 rounded" />

                    <CountryDropdown
                        value={country}
                        onChange={val => setCountry(val)}
                    />

                    <RegionDropdown
                        country={country}
                        value={region}
                        onChange={val => setRegion(val)}
                    />
                    <input type="date" className="w-full border p-2 rounded col-span-1 sm:col-span-3" />

                    <textarea placeholder="Message" className="w-full border p-2 rounded col-span-1 sm:col-span-3"></textarea>

                    <button
                        type="submit"
                        className="bg-green-900 text-white px-4 py-2 rounded hover:bg-green-700 col-span-1 sm:col-span-3"
                    >
                        Submit
                    </button>
                </form>

            </div>
        </>
    );
}
