"""Hardcoded reference data for the education knowledge graph."""

SUBJECTS = ["Math", "Science", "Language Arts", "Social Studies"]

GRADES = [
    {"level": "K", "age_range_low": 5, "age_range_high": 6},
    {"level": "1", "age_range_low": 6, "age_range_high": 7},
    {"level": "2", "age_range_low": 7, "age_range_high": 8},
    {"level": "3", "age_range_low": 8, "age_range_high": 9},
    {"level": "4", "age_range_low": 9, "age_range_high": 10},
    {"level": "5", "age_range_low": 10, "age_range_high": 11},
    {"level": "6", "age_range_low": 11, "age_range_high": 12},
    {"level": "7", "age_range_low": 12, "age_range_high": 13},
    {"level": "8", "age_range_low": 13, "age_range_high": 14},
    {"level": "9", "age_range_low": 14, "age_range_high": 15},
    {"level": "10", "age_range_low": 15, "age_range_high": 16},
    {"level": "11", "age_range_low": 16, "age_range_high": 17},
    {"level": "12", "age_range_low": 17, "age_range_high": 18},
]

STATES = [
    {"abbreviation": "AL", "name": "Alabama"},
    {"abbreviation": "AK", "name": "Alaska"},
    {"abbreviation": "AZ", "name": "Arizona"},
    {"abbreviation": "AR", "name": "Arkansas"},
    {"abbreviation": "CA", "name": "California"},
    {"abbreviation": "CO", "name": "Colorado"},
    {"abbreviation": "CT", "name": "Connecticut"},
    {"abbreviation": "DE", "name": "Delaware"},
    {"abbreviation": "FL", "name": "Florida"},
    {"abbreviation": "GA", "name": "Georgia"},
    {"abbreviation": "HI", "name": "Hawaii"},
    {"abbreviation": "ID", "name": "Idaho"},
    {"abbreviation": "IL", "name": "Illinois"},
    {"abbreviation": "IN", "name": "Indiana"},
    {"abbreviation": "IA", "name": "Iowa"},
    {"abbreviation": "KS", "name": "Kansas"},
    {"abbreviation": "KY", "name": "Kentucky"},
    {"abbreviation": "LA", "name": "Louisiana"},
    {"abbreviation": "ME", "name": "Maine"},
    {"abbreviation": "MD", "name": "Maryland"},
    {"abbreviation": "MA", "name": "Massachusetts"},
    {"abbreviation": "MI", "name": "Michigan"},
    {"abbreviation": "MN", "name": "Minnesota"},
    {"abbreviation": "MS", "name": "Mississippi"},
    {"abbreviation": "MO", "name": "Missouri"},
    {"abbreviation": "MT", "name": "Montana"},
    {"abbreviation": "NE", "name": "Nebraska"},
    {"abbreviation": "NV", "name": "Nevada"},
    {"abbreviation": "NH", "name": "New Hampshire"},
    {"abbreviation": "NJ", "name": "New Jersey"},
    {"abbreviation": "NM", "name": "New Mexico"},
    {"abbreviation": "NY", "name": "New York"},
    {"abbreviation": "NC", "name": "North Carolina"},
    {"abbreviation": "ND", "name": "North Dakota"},
    {"abbreviation": "OH", "name": "Ohio"},
    {"abbreviation": "OK", "name": "Oklahoma"},
    {"abbreviation": "OR", "name": "Oregon"},
    {"abbreviation": "PA", "name": "Pennsylvania"},
    {"abbreviation": "RI", "name": "Rhode Island"},
    {"abbreviation": "SC", "name": "South Carolina"},
    {"abbreviation": "SD", "name": "South Dakota"},
    {"abbreviation": "TN", "name": "Tennessee"},
    {"abbreviation": "TX", "name": "Texas"},
    {"abbreviation": "UT", "name": "Utah"},
    {"abbreviation": "VT", "name": "Vermont"},
    {"abbreviation": "VA", "name": "Virginia"},
    {"abbreviation": "WA", "name": "Washington"},
    {"abbreviation": "WV", "name": "West Virginia"},
    {"abbreviation": "WI", "name": "Wisconsin"},
    {"abbreviation": "WY", "name": "Wyoming"},
]

PHILOSOPHIES = [
    {
        "name": "place-nature-based",
        "description": (
            "Education rooted in outdoor exploration, ecological awareness, and "
            "hands-on interaction with the natural world. Emphasizes place-based "
            "learning, seasonal rhythms, and sensory-rich experiences."
        ),
        "disclaimer": None,
    },
    {
        "name": "waldorf-adjacent",
        "description": (
            "Inspired by Waldorf/Steiner principles including imagination-led "
            "learning, artistic integration, and developmental stage awareness. "
            "Emphasizes storytelling, rhythm, and hands-on creative work."
        ),
        "disclaimer": (
            "This curriculum draws inspiration from Waldorf educational philosophy "
            "but is not affiliated with or endorsed by any Waldorf school or the "
            "Association of Waldorf Schools of North America."
        ),
    },
    {
        "name": "montessori-inspired",
        "description": (
            "Guided by Montessori principles of self-directed activity, "
            "hands-on learning, and collaborative play. Emphasizes prepared "
            "environments, concrete-to-abstract progression, and child agency."
        ),
        "disclaimer": (
            "This curriculum draws inspiration from Montessori educational philosophy "
            "but is not affiliated with or endorsed by the Association Montessori "
            "Internationale or the American Montessori Society."
        ),
    },
    {
        "name": "project-based-learning",
        "description": (
            "Students learn by actively exploring real-world problems and "
            "challenges through extended projects. Emphasizes inquiry, "
            "collaboration, and authentic products."
        ),
        "disclaimer": None,
    },
    {
        "name": "flexible",
        "description": (
            "An eclectic approach that draws from multiple philosophies based on "
            "the child's needs and interests. Adaptable and parent-directed."
        ),
        "disclaimer": None,
    },
    {
        "name": "unschooling",
        "description": (
            "Child-led, interest-driven learning through everyday life and play. "
            "Trusts children's natural curiosity and intrinsic motivation. "
            "Emphasizes autonomy, real-world experiences, and learning without "
            "formal curriculum or imposed structure."
        ),
        "disclaimer": None,
    },
]

# Developmental milestones by age range and domain
MILESTONES = [
    # Kindergarten (5-6)
    {"id": "ms-cog-k", "description": "Counts to 20; recognizes basic shapes; sorts objects by attributes", "domain": "cognitive", "age_range_low": 5, "age_range_high": 6, "grade": "K"},
    {"id": "ms-mot-k", "description": "Holds pencil with tripod grip; cuts along lines with scissors; hops on one foot", "domain": "motor", "age_range_low": 5, "age_range_high": 6, "grade": "K"},
    {"id": "ms-lan-k", "description": "Speaks in complete sentences of 5-6 words; retells familiar stories; recognizes some letters and sounds", "domain": "language", "age_range_low": 5, "age_range_high": 6, "grade": "K"},
    {"id": "ms-soc-k", "description": "Takes turns in games; expresses emotions verbally; shows empathy toward peers", "domain": "social", "age_range_low": 5, "age_range_high": 6, "grade": "K"},
    # Grade 1 (6-7)
    {"id": "ms-cog-1", "description": "Adds and subtracts within 20; understands place value for tens and ones; tells time to the hour", "domain": "cognitive", "age_range_low": 6, "age_range_high": 7, "grade": "1"},
    {"id": "ms-mot-1", "description": "Writes legible letters and numbers; ties shoes; throws and catches a ball", "domain": "motor", "age_range_low": 6, "age_range_high": 7, "grade": "1"},
    {"id": "ms-lan-1", "description": "Reads simple sentences; writes short narratives; follows two-step instructions", "domain": "language", "age_range_low": 6, "age_range_high": 7, "grade": "1"},
    {"id": "ms-soc-1", "description": "Cooperates in group activities; understands rules and fairness; manages frustration with guidance", "domain": "social", "age_range_low": 6, "age_range_high": 7, "grade": "1"},
    # Grade 2 (7-8)
    {"id": "ms-cog-2", "description": "Adds and subtracts within 100; measures using standard units; understands fractions as parts of a whole", "domain": "cognitive", "age_range_low": 7, "age_range_high": 8, "grade": "2"},
    {"id": "ms-mot-2", "description": "Writes in cursive (beginning); uses rulers and simple tools; improved hand-eye coordination", "domain": "motor", "age_range_low": 7, "age_range_high": 8, "grade": "2"},
    {"id": "ms-lan-2", "description": "Reads chapter books independently; writes multi-paragraph texts; uses context clues for new words", "domain": "language", "age_range_low": 7, "age_range_high": 8, "grade": "2"},
    {"id": "ms-soc-2", "description": "Develops closer friendships; resolves conflicts with words; shows awareness of others' perspectives", "domain": "social", "age_range_low": 7, "age_range_high": 8, "grade": "2"},
    # Grade 3 (8-9)
    {"id": "ms-cog-3", "description": "Multiplies and divides within 100; understands area and perimeter; reads and creates simple graphs", "domain": "cognitive", "age_range_low": 8, "age_range_high": 9, "grade": "3"},
    {"id": "ms-mot-3", "description": "Fluent handwriting; uses compasses and protractors; participates in organized sports", "domain": "motor", "age_range_low": 8, "age_range_high": 9, "grade": "3"},
    {"id": "ms-lan-3", "description": "Reads for information and pleasure; writes organized essays with introduction and conclusion; uses dictionary independently", "domain": "language", "age_range_low": 8, "age_range_high": 9, "grade": "3"},
    {"id": "ms-soc-3", "description": "Strong sense of fairness; peer relationships increasingly important; can work independently for extended periods", "domain": "social", "age_range_low": 8, "age_range_high": 9, "grade": "3"},
    # Grade 4 (9-10)
    {"id": "ms-cog-4", "description": "Multi-digit multiplication; equivalent fractions and decimals; applies math to real-world problems", "domain": "cognitive", "age_range_low": 9, "age_range_high": 10, "grade": "4"},
    {"id": "ms-mot-4", "description": "Refined fine motor skills for detailed work; types with increasing speed; athletic skills developing", "domain": "motor", "age_range_low": 9, "age_range_high": 10, "grade": "4"},
    {"id": "ms-lan-4", "description": "Reads complex texts across genres; writes research reports; understands figurative language", "domain": "language", "age_range_low": 9, "age_range_high": 10, "grade": "4"},
    {"id": "ms-soc-4", "description": "Developing self-awareness; handles peer pressure; shows leadership in group settings", "domain": "social", "age_range_low": 9, "age_range_high": 10, "grade": "4"},
    # Grade 5 (10-11)
    {"id": "ms-cog-5", "description": "Fraction operations; volume and coordinate planes; beginning algebraic thinking", "domain": "cognitive", "age_range_low": 10, "age_range_high": 11, "grade": "5"},
    {"id": "ms-mot-5", "description": "Fine motor fully developed; complex craft and building projects; team sports coordination", "domain": "motor", "age_range_low": 10, "age_range_high": 11, "grade": "5"},
    {"id": "ms-lan-5", "description": "Analyzes text structure and author's purpose; writes persuasive essays; academic vocabulary expanding", "domain": "language", "age_range_low": 10, "age_range_high": 11, "grade": "5"},
    {"id": "ms-soc-5", "description": "Navigates complex social dynamics; developing moral reasoning; increased independence", "domain": "social", "age_range_low": 10, "age_range_high": 11, "grade": "5"},
]
