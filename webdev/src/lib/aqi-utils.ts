export function calculatePollutionScore(o3: number, no2: number) {
  // --- Risk Thresholds (from User Requirements) ---

  // O3 Thresholds
  // Low: < 100
  // Moderate: 100 - 160
  // High: 160 - 200
  // Very High: 200 - 300
  // Severe: > 300

  // NO2 Thresholds
  // Low: < 40
  // Moderate: 40 - 80
  // High: 80 - 180
  // Very High: 180 - 280
  // Severe: > 280

  // --- Risk Factor Descriptions ---
  const riskFactors = {
    O3: {
      High: "Respiratory irritation likely in sensitive groups.",
      VeryHigh: "Lung function reduction predicted; asthma triggers active.",
      Severe: "General population at risk of respiratory distress.",
    },
    NO2: {
      High: "Inflammation of airways; reduced lung function.",
      VeryHigh: "Increased susceptibility to respiratory infections.",
      Severe: "Severe aggravation of heart/lung diseases.",
    },
    Synergistic: "Combined toxic effect: Immediate health warning required.",
  };

  // Helper to determine level
  const getLevel = (val: number, type: "O3" | "NO2") => {
    if (type === "O3") {
      if (val < 100) return { level: "Low", score: 1 };
      if (val < 160) return { level: "Moderate", score: 2 };
      if (val < 200) return { level: "High", score: 3 };
      if (val < 300) return { level: "Very High", score: 4 };
      return { level: "Severe", score: 5 };
    } else {
      // NO2
      if (val < 40) return { level: "Low", score: 1 };
      if (val < 80) return { level: "Moderate", score: 2 };
      if (val < 180) return { level: "High", score: 3 };
      if (val < 280) return { level: "Very High", score: 4 };
      return { level: "Severe", score: 5 };
    }
  };

  const o3Status = getLevel(o3, "O3");
  const no2Status = getLevel(no2, "NO2");

  // --- Synergistic Effect Rule ---
  // If O3 > 160 (High+) AND NO2 > 100 (High+), Risk is SEVERE
  let isSynergistic = false;
  if (o3 > 160 && no2 > 100) {
    isSynergistic = true;
  }

  // Determine Dominant Pollutant & Final Category
  let finalLevel = "Low";
  let dominant = "NO2";
  let activeRiskFactors: string[] = [];

  // Compare scores (1-5)
  if (isSynergistic) {
    finalLevel = "Severe";
    dominant = "Combined (O3 + NO2)";
    activeRiskFactors.push(riskFactors.Synergistic);
    // Add specific risks too
    activeRiskFactors.push(riskFactors.O3.Severe); // Assume worst case for synergistic
    activeRiskFactors.push(riskFactors.NO2.Severe);
  } else {
    // Standard Max-Operator Logic
    if (o3Status.score > no2Status.score) {
      finalLevel = o3Status.level;
      dominant = "O3";
    } else if (no2Status.score > o3Status.score) {
      finalLevel = no2Status.level;
      dominant = "NO2";
    } else {
      // Tie
      finalLevel = o3Status.level;
      dominant = "O3 & NO2";
    }

    // Collect Risk Factors based on individual levels
    if (o3Status.score >= 3) {
      // High or above
      if (o3Status.score === 3) activeRiskFactors.push(riskFactors.O3.High);
      if (o3Status.score === 4) activeRiskFactors.push(riskFactors.O3.VeryHigh);
      if (o3Status.score === 5) activeRiskFactors.push(riskFactors.O3.Severe);
    }
    if (no2Status.score >= 3) {
      if (no2Status.score === 3) activeRiskFactors.push(riskFactors.NO2.High);
      if (no2Status.score === 4)
        activeRiskFactors.push(riskFactors.NO2.VeryHigh);
      if (no2Status.score === 5) activeRiskFactors.push(riskFactors.NO2.Severe);
    }
  }

  // If no specific high risks, add a generic safe message
  if (activeRiskFactors.length === 0) {
    activeRiskFactors.push("Air quality is within safe limits.");
  }

  return {
    score: Math.max(o3, no2), // Keep raw max for sorting if needed
    category: finalLevel, // Low, Moderate, High, Very High, Severe
    dominantPollutant: dominant,
    riskFactors: activeRiskFactors,
    isSynergistic: isSynergistic,
    details: {
      NO2: { val: no2, level: no2Status.level },
      O3: { val: o3, level: o3Status.level },
    },
  };
}
