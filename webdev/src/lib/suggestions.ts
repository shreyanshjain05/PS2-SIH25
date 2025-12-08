export const DEPARTMENT_SUGGESTIONS: Record<
  string,
  Record<string, string[]>
> = {
  "Health Dept": {
    Low: ["Routine monitoring.", "Promote outdoor activities."],
    Moderate: [
      "Monitor sensitive groups.",
      "Prepare advisories for asthmatics.",
    ],
    High: [
      "Issue health advisories for sensitive groups.",
      "Ensure hospitals are prepared for respiratory cases.",
      "Distribute masks in affected areas.",
    ],
    "Very High": [
      "Issue general health advisory to avoid outdoor exertion.",
      "Set up emergency respiratory clinics.",
      "Ensure availability of oxygen and nebulizers.",
    ],
    Severe: [
      "Declare health emergency.",
      "Advise everyone to stay indoors.",
      "Mobilize all medical resources.",
    ],
  },
  "Traffic Police": {
    Low: ["Normal traffic regulation."],
    Moderate: ["Monitor traffic flow in congestion points."],
    High: [
      "Increase traffic management at hotspots.",
      "Enforce pollution checks strictly.",
      "Divert heavy vehicles from city centers.",
    ],
    "Very High": [
      "Restrict entry of non-essential trucks.",
      "Enforce odd-even scheme if mandated.",
      "Stop construction activities near roads.",
    ],
    Severe: [
      "Ban all non-essential private transport.",
      "Allow only emergency and public transport.",
      "Strictly enforce zero-tolerance on visible emissions.",
    ],
  },
  "Education Board": {
    Low: ["Normal school activities."],
    Moderate: ["Limit prolonged outdoor activities for younger children."],
    High: [
      "Suspend outdoor sports and assemblies.",
      "Educate students on pollution protection.",
    ],
    "Very High": [
      "Close primary schools or shift to online classes.",
      "Cancel all outdoor events.",
    ],
    Severe: [
      "Close all educational institutions.",
      "Shift entirely to online learning.",
    ],
  },
  "Industrial Control": {
    Low: ["Routine inspections."],
    Moderate: ["Ensure compliance with emission norms."],
    High: [
      "Increase frequency of inspections.",
      "Issue warnings to non-compliant industries.",
      "Ban open waste burning.",
    ],
    "Very High": [
      "Shut down polluting industries temporarily.",
      "Strictly ban use of diesel generators.",
    ],
    Severe: [
      "Complete shutdown of all non-essential industries.",
      "Maximum penalty for violations.",
    ],
  },
};

export function getSuggestions(department: string, quality: string): string[] {
  const deptSuggestions = DEPARTMENT_SUGGESTIONS[department];
  if (!deptSuggestions) return [];

  // Handle potential mismatch in casing or terminology
  const normalizedQuality = quality === "Satisfactory" ? "Low" : quality;

  return deptSuggestions[normalizedQuality] || deptSuggestions["High"] || []; // Fallback
}
