"use client";

import { Shell } from "@/components/shell";
import { useState } from "react";

interface Standard {
  code: string;
  description: string;
  covered: boolean;
  lessonTitle?: string;
}

interface SubjectProgress {
  subject: string;
  total: number;
  covered: number;
  standards: Standard[];
}

// Mock data — will come from KG service + Postgres
const mockChildren = [
  { id: "1", name: "Emma", gradeLevel: "2", standardsOptIn: true },
  { id: "2", name: "Jack", gradeLevel: "4", standardsOptIn: true },
];

const mockProgress: Record<string, SubjectProgress[]> = {
  "1": [
    {
      subject: "Science",
      total: 12,
      covered: 3,
      standards: [
        { code: "2-LS4-1", description: "Make observations of plants and animals to compare the diversity of life in different habitats", covered: true, lessonTitle: "Trees & Photosynthesis Nature Walk" },
        { code: "2-LS2-1", description: "Plan and conduct an investigation to determine if plants need sunlight and water to grow", covered: true, lessonTitle: "Garden Experiment Week" },
        { code: "2-LS2-2", description: "Develop a simple model that mimics the function of an animal in dispersing seeds or pollinating plants", covered: true, lessonTitle: "Bee Pollination Project" },
        { code: "2-PS1-1", description: "Plan and conduct an investigation to describe and classify different kinds of materials by their observable properties", covered: false },
        { code: "2-PS1-2", description: "Analyze data obtained from testing different materials to determine which materials have the properties best suited for an intended purpose", covered: false },
        { code: "2-PS1-3", description: "Make observations to construct an evidence-based account of how an object made of a small set of pieces can be disassembled and made into a new object", covered: false },
        { code: "2-PS1-4", description: "Construct an argument with evidence that some changes caused by heating or cooling can be reversed and some cannot", covered: false },
        { code: "2-ESS1-1", description: "Use information from several sources to provide evidence that Earth events can occur quickly or slowly", covered: false },
        { code: "2-ESS2-1", description: "Compare multiple solutions designed to slow or prevent wind or water from changing the shape of the land", covered: false },
        { code: "2-ESS2-2", description: "Develop a model to represent the shapes and kinds of land and bodies of water in an area", covered: false },
        { code: "2-ESS2-3", description: "Obtain information to identify where water is found on Earth and that it can be solid or liquid", covered: false },
        { code: "K-2-ETS1-1", description: "Ask questions, make observations, and gather information about a situation people want to change", covered: false },
      ],
    },
    {
      subject: "Language Arts",
      total: 10,
      covered: 2,
      standards: [
        { code: "RI.2.1", description: "Ask and answer questions about key details in a text", covered: true, lessonTitle: "Trees & Photosynthesis Nature Walk" },
        { code: "W.2.2", description: "Write informative/explanatory texts that introduce a topic, use facts and definitions, and provide a concluding statement", covered: true, lessonTitle: "Ocean Ecosystem Journal" },
        { code: "RL.2.1", description: "Ask and answer questions about key details in a story", covered: false },
        { code: "RL.2.3", description: "Describe how characters in a story respond to major events and challenges", covered: false },
        { code: "RI.2.4", description: "Determine the meaning of words and phrases in a text relevant to a grade 2 topic or subject area", covered: false },
        { code: "W.2.1", description: "Write opinion pieces that introduce the topic, state an opinion, supply reasons, and provide a concluding statement", covered: false },
        { code: "W.2.3", description: "Write narratives that recount a well-elaborated event, include details, and provide a sense of closure", covered: false },
        { code: "SL.2.1", description: "Participate in collaborative conversations with diverse partners about grade 2 topics and texts", covered: false },
        { code: "SL.2.4", description: "Tell a story or recount an experience with appropriate facts and relevant details", covered: false },
        { code: "L.2.4", description: "Determine or clarify the meaning of unknown and multiple-meaning words and phrases", covered: false },
      ],
    },
    {
      subject: "Math",
      total: 8,
      covered: 0,
      standards: [
        { code: "2.OA.A.1", description: "Use addition and subtraction within 100 to solve one- and two-step word problems", covered: false },
        { code: "2.OA.B.2", description: "Fluently add and subtract within 20 using mental strategies", covered: false },
        { code: "2.NBT.A.1", description: "Understand that the three digits of a three-digit number represent amounts of hundreds, tens, and ones", covered: false },
        { code: "2.NBT.B.5", description: "Fluently add and subtract within 100 using strategies based on place value", covered: false },
        { code: "2.MD.A.1", description: "Measure the length of an object by selecting and using appropriate tools", covered: false },
        { code: "2.MD.A.3", description: "Estimate lengths using units of inches, feet, centimeters, and meters", covered: false },
        { code: "2.MD.C.7", description: "Tell and write time from analog and digital clocks to the nearest five minutes", covered: false },
        { code: "2.G.A.1", description: "Recognize and draw shapes having specified attributes, such as a given number of angles", covered: false },
      ],
    },
  ],
};

export default function StandardsPage() {
  const [selectedChild, setSelectedChild] = useState(mockChildren[0].id);
  const child = mockChildren.find((c) => c.id === selectedChild);
  const progress = mockProgress[selectedChild] || [];

  if (!child?.standardsOptIn) {
    return (
      <Shell>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">Standards tracking is off for {child?.name}</p>
          <p className="text-sm mt-2">You can enable it in the Children settings page.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Standards Progress</h1>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-900"
          >
            {mockChildren
              .filter((c) => c.standardsOptIn)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Grade {c.gradeLevel}
                </option>
              ))}
          </select>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {progress.map((sp) => {
            const pct = sp.total > 0 ? Math.round((sp.covered / sp.total) * 100) : 0;
            return (
              <div key={sp.subject} className="bg-white rounded border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">{sp.subject}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pct}%</p>
                <p className="text-xs text-gray-500">{sp.covered} of {sp.total} objectives</p>
                <div className="mt-2 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 rounded-full h-2 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed checklists */}
        {progress.map((sp) => (
          <div key={sp.subject} className="bg-white rounded border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">
                {sp.subject} — {sp.covered}/{sp.total} covered
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {sp.standards.map((std) => (
                <div
                  key={std.code}
                  className={`p-4 flex items-start gap-3 ${std.covered ? "bg-green-50/50" : ""}`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                    std.covered ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
                  }`}>
                    {std.covered && <span className="text-xs">✓</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{std.code}</span>
                      {std.covered && std.lessonTitle && (
                        <span className="text-xs text-green-600">via: {std.lessonTitle}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">{std.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
