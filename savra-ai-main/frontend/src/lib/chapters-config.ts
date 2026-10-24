// Chapters configuration for subjects by class (for mock/visualization mode)
// Based on NCERT curriculum - Classes 6-12
// Reference: https://drive.google.com/drive/folders/1PJzK5mRmTbw9Jo4p2QxFUBcZNPKpDmAr
// Structure: CLASS_CHAPTERS[class][subject] = [chapters] or { part1: [...], part2: [...] }

export interface ChapterPart {
  part1?: string[]
  part2?: string[]
}

export interface ClassChapterMap {
  [classNumber: number]: {
    [subjectName: string]: string[] | ChapterPart
  }
}

// Chapters organized by class and subject
export const CLASS_CHAPTERS: ClassChapterMap = {
  6: {
    "Mathematics": [
      "Knowing Our Numbers",
      "Whole Numbers",
      "Playing with Numbers",
      "Basic Geometrical Ideas",
      "Understanding Elementary Shapes",
      "Integers",
      "Fractions",
      "Decimals",
      "Data Handling",
      "Mensuration",
      "Algebra",
      "Ratio and Proportion",
      "Symmetry",
      "Practical Geometry"
    ],
    "Science": [
      "Food: Where Does It Come From?",
      "Components of Food",
      "Fibre to Fabric",
      "Sorting Materials into Groups",
      "Separation of Substances",
      "Changes Around Us",
      "Getting to Know Plants",
      "Body Movements",
      "The Living Organisms and Their Surroundings",
      "Motion and Measurement of Distances",
      "Light, Shadows and Reflections",
      "Electricity and Circuits",
      "Fun with Magnets",
      "Water",
      "Air Around Us",
      "Garbage In, Garbage Out"
    ],
    "English": [
      "Who Did Patrick's Homework?",
      "How the Dog Found Himself a New Master!",
      "Taro's Reward",
      "An Indian-American Woman in Space",
      "A Different Kind of School",
      "Who I Am",
      "Fair Play",
      "A Game of Chance",
      "Desert Animals",
      "The Banyan Tree"
    ],
    "Hindi": [
      "वह चिड़िया जो",
      "बचपन",
      "नादान दोस्त",
      "चाँद से थोड़ी सी गप्पें",
      "अक्षरों का महत्व",
      "पार नज़र के",
      "साथी हाथ बढ़ाना",
      "ऐसे-ऐसे",
      "टिकट अलबम",
      "झाँसी की रानी"
    ],
    "Social Science": [
      "What, Where, How and When?",
      "On The Trail of the Earliest People",
      "From Gathering to Growing Food",
      "In the Earliest Cities",
      "What Books and Burials Tell Us",
      "Kingdoms, Kings and an Early Republic",
      "New Questions and Ideas",
      "Ashoka, The Emperor Who Gave Up War",
      "Vital Villages, Thriving Towns",
      "Traders, Kings and Pilgrims",
      "New Empires and Kingdoms",
      "Buildings, Paintings and Books"
    ],
    "History": [
      "What, Where, How and When?",
      "On The Trail of the Earliest People",
      "From Gathering to Growing Food",
      "In the Earliest Cities",
      "What Books and Burials Tell Us",
      "Kingdoms, Kings and an Early Republic"
    ],
    "Geography": [
      "The Earth in the Solar System",
      "Globe: Latitudes and Longitudes",
      "Motions of the Earth",
      "Maps",
      "Major Domains of the Earth",
      "Major Landforms of the Earth",
      "Our Country - India",
      "India: Climate, Vegetation and Wildlife"
    ],
    "Political Science (Civics)": [
      "Understanding Diversity",
      "Diversity and Discrimination",
      "What is Government?",
      "Key Elements of a Democratic Government",
      "Panchayati Raj",
      "Rural Administration",
      "Urban Administration",
      "Rural Livelihoods",
      "Urban Livelihoods"
    ]
  },
  7: {
    "Mathematics": [
      "Integers",
      "Fractions and Decimals",
      "Data Handling",
      "Simple Equations",
      "Lines and Angles",
      "The Triangle and its Properties",
      "Congruence of Triangles",
      "Comparing Quantities",
      "Rational Numbers",
      "Practical Geometry",
      "Perimeter and Area",
      "Algebraic Expressions",
      "Exponents and Powers",
      "Symmetry",
      "Visualising Solid Shapes"
    ],
    "Science": [
      "Nutrition in Plants",
      "Nutrition in Animals",
      "Fibre to Fabric",
      "Heat",
      "Acids, Bases and Salts",
      "Physical and Chemical Changes",
      "Weather, Climate and Adaptations of Animals to Climate",
      "Winds, Storms and Cyclones",
      "Soil",
      "Respiration in Organisms",
      "Transportation in Animals and Plants",
      "Reproduction in Plants",
      "Motion and Time",
      "Electric Current and its Effects",
      "Light",
      "Water: A Precious Resource",
      "Forests: Our Lifeline",
      "Wastewater Story"
    ],
    "English": [
      "Three Questions",
      "A Gift of Chappals",
      "Gopal and the Hilsa Fish",
      "The Ashes that Made Trees Bloom",
      "Quality",
      "Expert Detectives",
      "The Invention of Vita-Wonk",
      "Fire: Friend and Foe",
      "A Bicycle in Good Repair",
      "The Story of Cricket"
    ],
    "Hindi": [
      "हम पंछी उन्मुक्त गगन के",
      "दादी माँ",
      "हिमालय की बेटियाँ",
      "कठपुतली",
      "मिठाईवाला",
      "रक्त और हमारा शरीर",
      "पापा खो गए",
      "शाम-एक किसान",
      "चिड़िया की बच्ची",
      "अपूर्व अनुभव"
    ],
    "Social Science": [
      "Tracing Changes Through a Thousand Years",
      "New Kings and Kingdoms",
      "The Delhi Sultans",
      "The Mughal Empire",
      "Rulers and Buildings",
      "Towns, Traders and Craftspersons",
      "Tribes, Nomads and Settled Communities",
      "Devotional Paths to the Divine",
      "The Making of Regional Cultures",
      "Eighteenth-Century Political Formations"
    ],
    "History": [
      "Tracing Changes Through a Thousand Years",
      "New Kings and Kingdoms",
      "The Delhi Sultans",
      "The Mughal Empire",
      "Rulers and Buildings"
    ],
    "Geography": [
      "Environment",
      "Inside Our Earth",
      "Our Changing Earth",
      "Air",
      "Water",
      "Natural Vegetation and Wildlife",
      "Human Environment – Settlement, Transport and Communication",
      "Human Environment Interactions – The Tropical and the Subtropical Region",
      "Life in the Temperate Grasslands",
      "Life in the Deserts"
    ],
    "Political Science (Civics)": [
      "On Equality",
      "Role of the Government in Health",
      "How the State Government Works",
      "Growing up as Boys and Girls",
      "Women Change the World",
      "Understanding Media",
      "Understanding Advertising",
      "Markets Around Us",
      "A Shirt in the Market",
      "Struggles for Equality"
    ]
  },
  8: {
    "Mathematics": [
      "Rational Numbers",
      "Linear Equations in One Variable",
      "Understanding Quadrilaterals",
      "Practical Geometry",
      "Data Handling",
      "Squares and Square Roots",
      "Cubes and Cube Roots",
      "Comparing Quantities",
      "Algebraic Expressions and Identities",
      "Visualising Solid Shapes",
      "Mensuration",
      "Exponents and Powers",
      "Direct and Inverse Proportions",
      "Factorisation",
      "Introduction to Graphs",
      "Playing with Numbers"
    ],
    "Science": [
      "Crop Production and Management",
      "Microorganisms: Friend and Foe",
      "Synthetic Fibres and Plastics",
      "Materials: Metals and Non-Metals",
      "Coal and Petroleum",
      "Combustion and Flame",
      "Conservation of Plants and Animals",
      "Cell – Structure and Functions",
      "Reproduction in Animals",
      "Reaching the Age of Adolescence",
      "Force and Pressure",
      "Friction",
      "Sound",
      "Chemical Effects of Electric Current",
      "Some Natural Phenomena",
      "Light",
      "Stars and the Solar System",
      "Pollution of Air and Water"
    ],
    "English": [
      "The Best Christmas Present in the World",
      "The Tsunami",
      "Glimpses of the Past",
      "Bepin Choudhury's Lapse of Memory",
      "The Summit Within",
      "This is Jody's Fawn",
      "A Visit to Cambridge",
      "A Short Monsoon Diary",
      "The Great Stone Face – I",
      "The Great Stone Face – II"
    ],
    "Hindi": [
      "ध्वनि",
      "लाख की चूड़ियाँ",
      "बस की यात्रा",
      "दीवानों की हस्ती",
      "चिट्ठियों की अनूठी दुनिया",
      "भगवान के डाकिए",
      "क्या निराश हुआ जाए",
      "यह सबसे कठिन समय नहीं",
      "कबीर की साखियाँ",
      "कामचोर"
    ],
    "Social Science": [
      "How, When and Where",
      "From Trade to Territory",
      "Ruling the Countryside",
      "Tribals, Dikus and the Vision of a Golden Age",
      "When People Rebel",
      "Colonialism and the City",
      "Weavers, Iron Smelters and Factory Owners",
      "Civilising the 'Native', Educating the Nation",
      "Women, Caste and Reform",
      "The Changing World of Visual Arts",
      "The Making of the National Movement: 1870s-1947",
      "India After Independence"
    ],
    "History": [
      "How, When and Where",
      "From Trade to Territory",
      "Ruling the Countryside",
      "Tribals, Dikus and the Vision of a Golden Age",
      "When People Rebel"
    ],
    "Geography": [
      "Resources",
      "Land, Soil, Water, Natural Vegetation and Wildlife Resources",
      "Mineral and Power Resources",
      "Agriculture",
      "Industries",
      "Human Resources"
    ],
    "Political Science (Civics)": [
      "The Indian Constitution",
      "Understanding Secularism",
      "Why Do We Need a Parliament?",
      "Understanding Laws",
      "Judiciary",
      "Understanding Our Criminal Justice System",
      "Understanding Marginalisation",
      "Confronting Marginalisation",
      "Public Facilities",
      "Law and Social Justice"
    ]
  },
  9: {
    "Mathematics": [
      "Number Systems",
      "Polynomials",
      "Coordinate Geometry",
      "Linear Equations in Two Variables",
      "Introduction to Euclid's Geometry",
      "Lines and Angles",
      "Triangles",
      "Quadrilaterals",
      "Areas of Parallelograms and Triangles",
      "Circles",
      "Constructions",
      "Heron's Formula",
      "Surface Areas and Volumes",
      "Statistics",
      "Probability"
    ],
    "Science": [
      "Matter in Our Surroundings",
      "Is Matter Around Us Pure",
      "Atoms and Molecules",
      "Structure of the Atom",
      "The Fundamental Unit of Life",
      "Tissues",
      "Diversity in Living Organisms",
      "Motion",
      "Force and Laws of Motion",
      "Gravitation",
      "Work and Energy",
      "Sound",
      "Why Do We Fall Ill",
      "Natural Resources",
      "Improvement in Food Resources"
    ],
    "Physics": [
      "Motion",
      "Force and Laws of Motion",
      "Gravitation",
      "Work and Energy",
      "Sound"
    ],
    "Chemistry": [
      "Matter in Our Surroundings",
      "Is Matter Around Us Pure",
      "Atoms and Molecules",
      "Structure of the Atom"
    ],
    "Biology": [
      "The Fundamental Unit of Life",
      "Tissues",
      "Diversity in Living Organisms",
      "Why Do We Fall Ill",
      "Natural Resources",
      "Improvement in Food Resources"
    ],
    "English": [
      "The Fun They Had",
      "The Sound of Music",
      "The Little Girl",
      "A Truly Beautiful Mind",
      "The Snake and the Mirror",
      "My Childhood",
      "Packing",
      "Reach for the Top",
      "The Bond of Love",
      "Kathmandu",
      "If I Were You"
    ],
    "Hindi": [
      "दो बैलों की कथा",
      "ल्हासा की ओर",
      "उपभोक्तावाद की संस्कृति",
      "साँवले सपनों की याद",
      "नाना साहब की पुत्री देवी मैना को भस्म कर दिया गया",
      "प्रेमचंद के फटे जूते",
      "मेरे बचपन के दिन",
      "एक कुत्ता और एक मैना",
      "साखियाँ एवं सबद",
      "वाख",
      "सवैये",
      "कैदी और कोकिला",
      "ग्राम श्री",
      "चंद्र गहना से लौटती बेर",
      "मेघ आए",
      "यमराज की दिशा",
      "बच्चे काम पर जा रहे हैं"
    ],
    "Social Science": [
      "The French Revolution",
      "Socialism in Europe and the Russian Revolution",
      "Nazism and the Rise of Hitler",
      "Forest Society and Colonialism",
      "Pastoralists in the Modern World",
      "Peasants and Farmers",
      "History and Sport: The Story of Cricket",
      "Clothing: A Social History"
    ],
    "History": [
      "The French Revolution",
      "Socialism in Europe and the Russian Revolution",
      "Nazism and the Rise of Hitler",
      "Forest Society and Colonialism"
    ],
    "Geography": [
      "India – Size and Location",
      "Physical Features of India",
      "Drainage",
      "Climate",
      "Natural Vegetation and Wildlife",
      "Population"
    ],
    "Political Science (Civics)": [
      "What is Democracy? Why Democracy?",
      "Constitutional Design",
      "Electoral Politics",
      "Working of Institutions",
      "Democratic Rights"
    ],
    "Economics": [
      "The Story of Village Palampur",
      "People as Resource",
      "Poverty as a Challenge",
      "Food Security in India"
    ],
    "Computer Science": [
      "Basics of Information Technology",
      "Cyber Safety",
      "Office Tools",
      "Scratch or Python",
      "Lab Exercises"
    ]
  },
  10: {
    "Mathematics": [
      "Real Numbers",
      "Polynomials",
      "Pair of Linear Equations in Two Variables",
      "Quadratic Equations",
      "Arithmetic Progressions",
      "Triangles",
      "Coordinate Geometry",
      "Introduction to Trigonometry",
      "Some Applications of Trigonometry",
      "Circles",
      "Constructions",
      "Areas Related to Circles",
      "Surface Areas and Volumes",
      "Statistics",
      "Probability"
    ],
    "Science": [
      "Chemical Reactions and Equations",
      "Acids, Bases and Salts",
      "Metals and Non-metals",
      "Carbon and its Compounds",
      "Periodic Classification of Elements",
      "Life Processes",
      "Control and Coordination",
      "How do Organisms Reproduce?",
      "Heredity and Evolution",
      "Light – Reflection and Refraction",
      "Human Eye and Colourful World",
      "Electricity",
      "Magnetic Effects of Electric Current",
      "Sources of Energy",
      "Our Environment",
      "Management of Natural Resources"
    ],
    "Physics": [
      "Light – Reflection and Refraction",
      "Human Eye and Colourful World",
      "Electricity",
      "Magnetic Effects of Electric Current",
      "Sources of Energy"
    ],
    "Chemistry": [
      "Chemical Reactions and Equations",
      "Acids, Bases and Salts",
      "Metals and Non-metals",
      "Carbon and its Compounds",
      "Periodic Classification of Elements"
    ],
    "Biology": [
      "Life Processes",
      "Control and Coordination",
      "How do Organisms Reproduce?",
      "Heredity and Evolution",
      "Our Environment",
      "Management of Natural Resources"
    ],
    "English": [
      "A Letter to God",
      "Nelson Mandela: Long Walk to Freedom",
      "Two Stories About Flying",
      "From the Diary of Anne Frank",
      "The Hundred Dresses – I",
      "The Hundred Dresses – II",
      "Glimpses of India",
      "Mijbil the Otter",
      "Madam Rides the Bus",
      "The Sermon at Benares",
      "The Proposal"
    ],
    "Hindi": [
      "सूरदास",
      "तुलसीदास",
      "देव",
      "जयशंकर प्रसाद",
      "सूर्यकांत त्रिपाठी 'निराला'",
      "नागार्जुन",
      "गिरिजाकुमार माथुर",
      "ऋतुराज",
      "मंगलेश डबराल",
      "स्वयं प्रकाश",
      "रामवृक्ष बेनीपुरी",
      "यशपाल",
      "सर्वेश्वर दयाल सक्सेना",
      "मन्नू भंडारी",
      "महावीर प्रसाद द्विवेदी",
      "यतीन्द्र मिश्र",
      "भदंत आनंद कौसल्यायन"
    ],
    "Social Science": [
      "The Rise of Nationalism in Europe",
      "Nationalism in India",
      "The Making of a Global World",
      "The Age of Industrialisation",
      "Print Culture and the Modern World"
    ],
    "History": [
      "The Rise of Nationalism in Europe",
      "Nationalism in India",
      "The Making of a Global World",
      "The Age of Industrialisation",
      "Print Culture and the Modern World"
    ],
    "Geography": [
      "Resources and Development",
      "Forest and Wildlife Resources",
      "Water Resources",
      "Agriculture",
      "Minerals and Energy Resources",
      "Manufacturing Industries",
      "Lifelines of National Economy"
    ],
    "Political Science (Civics)": [
      "Power Sharing",
      "Federalism",
      "Democracy and Diversity",
      "Gender, Religion and Caste",
      "Popular Struggles and Movements",
      "Political Parties",
      "Outcomes of Democracy",
      "Challenges to Democracy"
    ],
    "Economics": [
      "Development",
      "Sectors of the Indian Economy",
      "Money and Credit",
      "Globalisation and the Indian Economy",
      "Consumer Rights"
    ],
    "Computer Science": [
      "Internet Basics",
      "Internet Services",
      "Database Concepts",
      "Introduction to XML",
      "Societal Impacts of IT"
    ]
  },
  11: {
    "Mathematics": {
      part1: [
        "Sets",
        "Relations and Functions",
        "Trigonometric Functions",
        "Principle of Mathematical Induction",
        "Complex Numbers and Quadratic Equations",
        "Linear Inequalities",
        "Permutations and Combinations",
        "Binomial Theorem",
        "Sequences and Series"
      ],
      part2: [
        "Straight Lines",
        "Conic Sections",
        "Introduction to Three Dimensional Geometry",
        "Limits and Derivatives",
        "Mathematical Reasoning",
        "Statistics",
        "Probability"
      ]
    },
    "Physics": {
      part1: [
        "Physical World",
        "Units and Measurements",
        "Motion in a Straight Line",
        "Motion in a Plane",
        "Laws of Motion",
        "Work, Energy and Power",
        "System of Particles and Rotational Motion",
        "Gravitation"
      ],
      part2: [
        "Mechanical Properties of Solids",
        "Mechanical Properties of Fluids",
        "Thermal Properties of Matter",
        "Thermodynamics",
        "Kinetic Theory",
        "Oscillations",
        "Waves"
      ]
    },
    "Chemistry": {
      part1: [
        "Some Basic Concepts of Chemistry",
        "Structure of Atom",
        "Classification of Elements and Periodicity in Properties",
        "Chemical Bonding and Molecular Structure",
        "States of Matter",
        "Thermodynamics",
        "Equilibrium"
      ],
      part2: [
        "Redox Reactions",
        "Hydrogen",
        "The s-Block Elements",
        "The p-Block Elements",
        "Organic Chemistry – Some Basic Principles and Techniques",
        "Hydrocarbons",
        "Environmental Chemistry"
      ]
    },
    "Biology": {
      part1: [
        "The Living World",
        "Biological Classification",
        "Plant Kingdom",
        "Animal Kingdom",
        "Morphology of Flowering Plants",
        "Anatomy of Flowering Plants",
        "Structural Organisation in Animals",
        "Cell: The Unit of Life",
        "Biomolecules",
        "Cell Cycle and Cell Division",
        "Transport in Plants",
        "Mineral Nutrition",
        "Photosynthesis in Higher Plants",
        "Respiration in Plants",
        "Plant Growth and Development"
      ],
      part2: [
        "Digestion and Absorption",
        "Breathing and Exchange of Gases",
        "Body Fluids and Circulation",
        "Excretory Products and their Elimination",
        "Locomotion and Movement",
        "Neural Control and Coordination",
        "Chemical Coordination and Integration"
      ]
    },
    "English": [
      "The Portrait of a Lady",
      "We're Not Afraid to Die... if We Can All Be Together",
      "Discovering Tut: the Saga Continues",
      "Landscape of the Soul",
      "The Ailing Planet: the Green Movement's Role",
      "The Browning Version",
      "The Adventure",
      "Silk Road",
      "Father to Son"
    ],
    "Hindi": [
      "प्रेमचंद",
      "जयशंकर प्रसाद",
      "सूर्यकांत त्रिपाठी 'निराला'",
      "सुमित्रानंदन पंत",
      "मुक्तिबोध",
      "रामविलास शर्मा",
      "नामवर सिंह",
      "भीमराव अंबेडकर",
      "हजारी प्रसाद द्विवेदी",
      "बालमुकुंद गुप्त"
    ],
    "History": [
      "From the Beginning of Time",
      "Writing and City Life",
      "An Empire Across Three Continents",
      "Central Islamic Lands",
      "Nomadic Empires",
      "The Three Orders",
      "Changing Cultural Traditions",
      "Confrontation of Cultures",
      "The Industrial Revolution",
      "Displacing Indigenous Peoples",
      "Paths to Modernisation"
    ],
    "Geography": [
      "Geography as a Discipline",
      "The Origin and Evolution of the Earth",
      "Interior of the Earth",
      "Distribution of Oceans and Continents",
      "Minerals and Rocks",
      "Geomorphic Processes",
      "Landforms and their Evolution",
      "Composition and Structure of Atmosphere",
      "Solar Radiation, Heat Balance and Temperature",
      "Atmospheric Circulation and Weather Systems",
      "Water in the Atmosphere",
      "World Climate and Climate Change",
      "Water (Oceans)",
      "Movements of Ocean Water",
      "Life on the Earth",
      "Biodiversity and Conservation"
    ],
    "Political Science (Civics)": [
      "Political Theory: An Introduction",
      "Freedom",
      "Equality",
      "Social Justice",
      "Rights",
      "Citizenship",
      "Nationalism",
      "Secularism",
      "Peace",
      "Development"
    ],
    "Economics": [
      "Introduction",
      "Collection of Data",
      "Organisation of Data",
      "Presentation of Data",
      "Measures of Central Tendency",
      "Measures of Dispersion",
      "Correlation",
      "Index Numbers",
      "Uses of Statistical Methods"
    ],
    "Computer Science": [
      "Computer Systems and Organisation",
      "Computational Thinking and Programming",
      "Data Management",
      "Society, Law and Ethics"
    ]
  },
  12: {
    "Mathematics": {
      part1: [
        "Relations and Functions",
        "Inverse Trigonometric Functions",
        "Matrices",
        "Determinants",
        "Continuity and Differentiability",
        "Application of Derivatives",
        "Integrals",
        "Application of Integrals"
      ],
      part2: [
        "Differential Equations",
        "Vector Algebra",
        "Three Dimensional Geometry",
        "Linear Programming",
        "Probability"
      ]
    },
    "Physics": {
      part1: [
        "Electric Charges and Fields",
        "Electrostatic Potential and Capacitance",
        "Current Electricity",
        "Moving Charges and Magnetism",
        "Magnetism and Matter",
        "Electromagnetic Induction",
        "Alternating Current",
        "Electromagnetic Waves"
      ],
      part2: [
        "Ray Optics and Optical Instruments",
        "Wave Optics",
        "Dual Nature of Radiation and Matter",
        "Atoms",
        "Nuclei",
        "Semiconductor Electronics: Materials, Devices and Simple Circuits",
        "Communication Systems"
      ]
    },
    "Chemistry": {
      part1: [
        "The Solid State",
        "Solutions",
        "Electrochemistry",
        "Chemical Kinetics",
        "Surface Chemistry",
        "General Principles and Processes of Isolation of Elements",
        "The p-Block Elements",
        "The d and f Block Elements",
        "Coordination Compounds"
      ],
      part2: [
        "Haloalkanes and Haloarenes",
        "Alcohols, Phenols and Ethers",
        "Aldehydes, Ketones and Carboxylic Acids",
        "Amines",
        "Biomolecules",
        "Polymers",
        "Chemistry in Everyday Life"
      ]
    },
    "Biology": {
      part1: [
        "Reproduction in Organisms",
        "Sexual Reproduction in Flowering Plants",
        "Human Reproduction",
        "Reproductive Health",
        "Principles of Inheritance and Variation",
        "Molecular Basis of Inheritance",
        "Evolution",
        "Human Health and Disease"
      ],
      part2: [
        "Strategies for Enhancement in Food Production",
        "Microbes in Human Welfare",
        "Biotechnology: Principles and Processes",
        "Biotechnology and its Applications",
        "Organisms and Populations",
        "Ecosystem",
        "Biodiversity and Conservation",
        "Environmental Issues"
      ]
    },
    "English": [
      "The Last Lesson",
      "Lost Spring",
      "Deep Water",
      "The Rattrap",
      "Indigo",
      "Poets and Pancakes",
      "The Interview",
      "Going Places",
      "My Mother at Sixty-Six",
      "An Elementary School Classroom in a Slum",
      "Keeping Quiet",
      "A Thing of Beauty",
      "A Roadside Stand",
      "Aunt Jennifer's Tigers"
    ],
    "Hindi": [
      "हरिवंश राय बच्चन",
      "आलोक धन्वा",
      "कुंवर नारायण",
      "रघुवीर सहाय",
      "गजानन माधव मुक्तिबोध",
      "शमशेर बहादुर सिंह",
      "सूर्यकांत त्रिपाठी 'निराला'",
      "तुलसीदास",
      "फ़िराक गोरखपुरी",
      "उमाशंकर जोशी",
      "महादेवी वर्मा",
      "जैनेन्द्र कुमार",
      "धर्मवीर भारती",
      "भीष्म साहनी",
      "असगर वजाहत"
    ],
    "History": [
      "Bricks, Beads and Bones",
      "Kings, Farmers and Towns",
      "Kinship, Caste and Class",
      "Thinkers, Beliefs and Buildings",
      "Through the Eyes of Travellers",
      "Bhakti-Sufi Traditions",
      "An Imperial Capital: Vijayanagara",
      "Peasants, Zamindars and the State",
      "Kings and Chronicles",
      "Colonialism and the Countryside",
      "Rebels and the Raj",
      "Colonial Cities",
      "Mahatma Gandhi and National Movements",
      "Understanding Partition",
      "Framing the Constitution"
    ],
    "Geography": [
      "Human Geography: Nature and Scope",
      "The World Population: Distribution, Density and Growth",
      "Population Composition",
      "Human Development",
      "Primary Activities",
      "Secondary Activities",
      "Tertiary and Quaternary Activities",
      "Transport and Communication",
      "International Trade",
      "Human Settlements"
    ],
    "Political Science (Civics)": [
      "Challenges of Nation Building",
      "Era of One-Party Dominance",
      "Politics of Planned Development",
      "India's External Relations",
      "Challenges to and Restoration of the Congress System",
      "The Crisis of Democratic Order",
      "Rise of Popular Movements",
      "Regional Aspirations",
      "Recent Developments in Indian Politics"
    ],
    "Economics": [
      "Introduction to Macroeconomics",
      "National Income Accounting",
      "Money and Banking",
      "Determination of Income and Employment",
      "Government Budget and the Economy",
      "Open Economy Macroeconomics"
    ],
    "Computer Science": [
      "Exception Handling in Python",
      "File Handling in Python",
      "Stack",
      "Queue",
      "Sorting",
      "Searching",
      "Understanding Data",
      "Database Concepts",
      "Structured Query Language (SQL)",
      "Computer Networks",
      "Data Communication",
      "Web Services",
      "Society, Law and Ethics"
    ]
  }
}

// Get chapters for a specific class and subject (handles both simple arrays and parts)
export const getChaptersForClassAndSubject = (
  classNumber: number,
  subjectName: string
): Array<{ id: string; name: string; part?: string }> => {
  const classChapters = CLASS_CHAPTERS[classNumber]
  if (!classChapters) return []
  
  // Case-insensitive subject name matching
  const normalizedSubjectName = subjectName.trim()
  const subjectKeys = Object.keys(classChapters)
  const matchingKey = subjectKeys.find(
    key => key.toLowerCase() === normalizedSubjectName.toLowerCase()
  )
  
  if (!matchingKey) return []
  
  const chaptersData = classChapters[matchingKey]
  if (!chaptersData) return []
  
  // Check if chapters are organized by parts
  if (typeof chaptersData === 'object' && 'part1' in chaptersData) {
    const parts = chaptersData as ChapterPart
    const result: Array<{ id: string; name: string; part: string }> = []
    
    // Add Part 1 chapters
    if (parts.part1) {
      parts.part1.forEach((name, index) => {
        result.push({
          id: `mock-chapter-${classNumber}-${subjectName.toLowerCase().replace(/\s+/g, '-')}-part1-${index + 1}`,
          name,
          part: 'Part 1'
        })
      })
    }
    
    // Add Part 2 chapters
    if (parts.part2) {
      parts.part2.forEach((name, index) => {
        result.push({
          id: `mock-chapter-${classNumber}-${subjectName.toLowerCase().replace(/\s+/g, '-')}-part2-${index + 1}`,
          name,
          part: 'Part 2'
        })
      })
    }
    
    return result
  }
  
  // Handle simple array format (no parts)
  const chapters = chaptersData as string[]
  return chapters.map((name, index) => ({
    id: `mock-chapter-${classNumber}-${subjectName.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
    name
  }))
}

// Legacy function for backward compatibility (uses first available class)
export const getChaptersForSubject = (subjectName: string): Array<{ id: string; name: string }> => {
  // Try to find the subject in any class (prefer class 9 as it's common)
  for (const classNum of [9, 10, 8, 11, 12, 7, 6]) {
    const chapters = CLASS_CHAPTERS[classNum]?.[subjectName]
    if (chapters) {
      // Check if it's a simple array
      if (Array.isArray(chapters) && chapters.length > 0) {
        return chapters.map((name: string, index: number) => ({
          id: `mock-chapter-${classNum}-${subjectName.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
          name
        }))
      }
      // If it's a ChapterPart, combine part1 and part2
      if (typeof chapters === 'object' && 'part1' in chapters) {
        const parts = chapters as ChapterPart
        const allChapters: string[] = []
        if (parts.part1) allChapters.push(...parts.part1)
        if (parts.part2) allChapters.push(...parts.part2)
        if (allChapters.length > 0) {
          return allChapters.map((name: string, index: number) => ({
            id: `mock-chapter-${classNum}-${subjectName.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
            name
          }))
        }
      }
    }
  }
  return []
}
