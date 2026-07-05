// Shared industry taxonomy used by:
//   - resources/js/pages/home/InDemandPrograms.jsx (dark carousel on Home)
//   - resources/js/pages/programs/ProgramsLevels.jsx ("Browse by industry"
//     block above the programme grid)
//
// Single source of truth so a new industry / programme rename edits one
// file instead of drifting between the two views. `image` keys reference
// asset paths that the consumer resolves — we don't import the image
// modules here so this file stays a plain data module.

export const INDUSTRY_CATEGORIES = [
    {
        id: 1,
        title: "IT / Computer Science & Data",
        description:
            "Degrees such as a Bachelor in Computer Science, Software Engineering or Data Science are in " +
            "high demand thanks to the growth of tech, cybersecurity, and data-driven industries.",
        programs: [
            "Bachelor of Computer Science",
            "Bachelor of Information Technology",
            "Bachelor of Software Engineering",
            "Bachelor of Data Science",
        ],
        intakes: ["February", "March", "May", "July"],
        tags: ["Technology", "Bachelor"],
        image: "education",
    },
    {
        id: 2,
        title: "Engineering (Civil, Electrical, Mechanical, Environmental)",
        description:
            "Infrastructure growth and the shift to renewable energy are driving strong demand for engineers. " +
            "Degrees in Civil, Mechanical, and Electrical Engineering open doors across NZ.",
        programs: [
            "Bachelor of Civil Engineering",
            "Bachelor of Mechanical Engineering",
            "Bachelor of Electrical Engineering",
            "Bachelor of Computer Engineering",
            "Bachelor of Chemical Engineering",
        ],
        intakes: ["February", "March", "June", "July"],
        tags: ["Engineering", "Bachelor"],
        image: "agents",
    },
    {
        id: 3,
        title: "Healthcare / Nursing / Allied Health",
        description:
            "Healthcare degrees such as Bachelor of Nursing, Physiotherapy, etc, are in demand given ageing " +
            "populations and ongoing shortages in key health professions.",
        programs: [
            "Bachelor of Nursing",
            "Bachelor of Medicine",
            "Bachelor of Pharmacy",
            "Bachelor of Physiotherapy",
            "Bachelor of Medical Laboratory Science",
        ],
        intakes: ["February", "March", "April", "May", "June", "July", "August"],
        tags: ["Healthcare", "Diploma"],
        image: "settlement",
    },
    {
        id: 4,
        title: "Applied Management, Business Administration, Business Informatics",
        description:
            "Advanced management, leadership, and analytical skills for New Zealand's business and tech " +
            "sectors, preparing learners for diverse roles through strategic, industry-focused training.",
        programs: [
            "Bachelor of Business Administration",
            "Bachelor of Commerce",
            "Bachelor of Applied Management",
            "Bachelor of Business Informatics",
            "Bachelor of Management Studies",
        ],
        intakes: ["February", "March", "April", "May", "July", "August"],
        tags: ["Business", "Bachelor"],
        image: "education",
    },
    {
        id: 5,
        title: "Education / Teaching (particularly STEM-specialised teachers)",
        description:
            "There is demand for teachers in certain subjects (maths, science) and regions. While a Bachelor " +
            "in Education is required, emphasising STEM-teaching can strengthen the profile.",
        programs: [
            "Bachelor of Education",
            "Bachelor of Early Childhood Education",
            "Bachelor of Primary Education",
            "Bachelor of Secondary Education",
            "Bachelor of Special Education",
        ],
        intakes: ["February", "March", "April", "May", "June"],
        tags: ["Education", "Bachelor"],
        image: "visa",
    },
];
