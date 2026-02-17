import { useState, useEffect } from "react";
import ModalImage from "@assets/modaloverlap.png";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row items-center max-w-lg w-11/12 md:w-3/5">

        {/* Overlapping Illustration */}
        <div className="absolute -left-20 top-22 transform -translate-y-1/2 hidden md:block">
          <img
            src={ModalImage}
            alt="Illustration"
            className="w-50 h-150 object-contain drop-shadow-lg"
          />
        </div>

        {/* Text Section */}
        <div className="flex-1 md:ml-20 text-center md:text-left">
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 hover:cursor-pointer"
          >
            ✕
          </button>

          <h2 className="text-xl font-bold mb-2">Welcome to Epathways!</h2>
          <p className="text-gray-600 mb-4">
            Take the first step toward your future, book your free pre-assessment today!
          </p>
          <div className="mt-6 flex justify-center">
            <a href="https://go.epathways.co.nz/widget/form/1Br8Dd3Q5wiNXjc5sCLx?notrack=true" className="bg-green-800 text-white px-4 py-2 rounded hover:bg-green-700 animate-zoom ">
              Book Now!
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

















// import React from "react";
// import { motion } from "framer-motion";

// const Modal = ({ isOpen, onClose }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
//       <div className="bg-white rounded-lg shadow-lg w-10/12 sm:w-2/5 lg:w-1/3 p-6 relative">
//         {/* Close Button */}
//         <button
//           onClick={onClose}
//           className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 hover:cursor-pointer"
//         >
//           ✖
//         </button>

//         {/* Modal Content */}
//         <h2 className="text-2xl font-bold mb-4 text-center">Welcome to Epathways!</h2>
//         <p className="text-gray-600 text-center text-xl">
//           Take the first step toward your future, book your free pre-assessment today!
//         </p>

//         <div className="mt-6 flex justify-center">
//           <a href="/booking" className="bg-green-800 text-white px-4 py-2 rounded hover:bg-green-700 animate-zoom ">
//             Book Now!
//           </a>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Modal;
