export const SUBJECTS = [
  "Math",
  "Science",
  "Language Arts",
  "Social Studies",
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const PHILOSOPHIES = [
  { id: "flexible", label: "Flexible", description: "Blends approaches based on the subject, age, and your child's needs" },
  { id: "waldorf-adjacent", label: "Waldorf-Inspired", description: "Follows Waldorf principles and methods", disclaimer: "This lesson draws from Waldorf educational principles but may not align exactly with traditional Waldorf curriculum sequencing, which prescribes specific content for specific ages." },
  { id: "montessori-inspired", label: "Montessori-Inspired", description: "Hands-on, child-led, concrete-to-abstract learning" },
  { id: "project-based-learning", label: "Project-Based Learning", description: "Extended projects, inquiry-driven, real-world problems" },
  { id: "place-nature-based", label: "Place/Nature-Based", description: "Outdoor learning, local environment, natural materials" },
  { id: "unschooling", label: "Unschooling", description: "Child-led, interest-driven learning through everyday life and play" },
  { id: "charlotte-mason", label: "Charlotte Mason", description: "Living books, narration, nature study, and short focused lessons" },
  { id: "classical", label: "Classical", description: "Trivium-based: memorization, logic, and rhetoric through Great Books and structured study" },
] as const;

export type PhilosophyId = (typeof PHILOSOPHIES)[number]["id"];

export const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;
export type Grade = (typeof GRADES)[number];

export const US_STATES = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" }, { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" }, { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" }, { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" }, { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" }, { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" }, { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" },
  { abbr: "SC", name: "South Carolina" }, { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" }, { abbr: "VT", name: "Vermont" },
  { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" },
] as const;
