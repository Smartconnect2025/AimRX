/**
 * Provider Order Review Constants
 * 
 * Question mappings and display configurations for provider order review
 */

export const QUESTIONNAIRE_QUESTIONS = {
  GENERAL: {
    SMOKING: {
      label: "Do you smoke?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" }
      ]
    },
    ALCOHOL: {
      label: "Do you drink alcohol?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" }
      ]
    },
    RECREATIONAL_DRUGS: {
      label: "Do you use recreational drugs?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" }
      ]
    },
    HEART_PROBLEMS: {
      label: "Do you have any heart problems?",
      options: [
        { value: "heart-disease", label: "Heart disease" },
        { value: "high-blood-pressure", label: "High blood pressure" },
        { value: "low-blood-pressure", label: "Low blood pressure" },
        { value: "stroke", label: "Stroke or mini-stroke" },
        { value: "chest-pain", label: "Chest pain/angina/heart attack" },
        { value: "none", label: "None of these" },
      ]
    },
    SEX_LIFE: {
      label: "Which best describes your sex life?",
      options: [
        { value: "very-active", label: "Very active" },
        { value: "active", label: "Active" },
        { value: "somewhat-active", label: "Somewhat active" },
        { value: "not-active", label: "Not active" },
        { value: "planned", label: "Planned" }
      ]
    },
    ERECTION_FREQUENCY: {
      label: "How often are you unable to achieve or maintain an erection suitable for sexual activity?",
      options: [
        { value: "never", label: "Never" },
        { value: "rarely", label: "Rarely" },
        { value: "sometimes", label: "Sometimes" },
        { value: "often", label: "Often" },
        { value: "always", label: "Always" },
        { value: "occasionally", label: "Occasionally" }
      ]
    },
    ERECTION_HARDNESS: {
      label: "How would you rate the hardness of your erection?",
      options: [
        { value: "very-hard", label: "Penis is hard enough for penetration, but not completely hard" },
        { value: "hard", label: "Penis is hard enough for penetration" },
        { value: "soft", label: "Penis is not completely hard" },
        { value: "very-soft", label: "Penis is hard enough for penetration, but not completely hard" }
      ]
    },
    SYMPTOM_DURATION: {
      label: "How long have you experienced these symptoms?",
      options: [
        { value: "less-than-month", label: "Less than a month" },
        { value: "1-3-months", label: "1-3 months" },
        { value: "3-6-months", label: "3-6 months" },
        { value: "6-12-months", label: "6-12 months" },
        { value: "over-year", label: "Over a year" }
      ]
    },
    STATE: {
      label: "What state are you located in?",
    }
  },
  DEMOGRAPHIC: {
    FIRST_NAME: {
      label: "First Name"
    },
    LAST_NAME: {
      label: "Last Name"
    },
    GENDER: {
      label: "Gender",
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" }
      ]
    },
    DATE_OF_BIRTH: {
      label: "Date of Birth"
    },
    HEIGHT: {
      label: "Height"
    },
    WEIGHT: {
      label: "Weight (lbs)"
    },
    PHONE: {
      label: "Phone Number"
    }
  },
  MEDICAL_HISTORY: {
    MEDICAL_DIAGNOSES: {
      label: "Have you been diagnosed with any of the following?",
      options: [
        { value: "Diabetes", label: "Diabetes" },
        { value: "Liver disease", label: "Liver disease" },
        { value: "Kidney disease", label: "Kidney disease" },
        { value: "Peyronie's disease (penile curvature)", label: "Peyronie's disease (penile curvature)" },
        { value: "Blood disorders (e.g., leukemia, sickle cell anemia)", label: "Blood disorders (e.g., leukemia, sickle cell anemia)" },
        { value: "Gastric/Stomach issues", label: "Gastric/Stomach issues" },
        { value: "None of these", label: "None of these" }
      ]
    },
    RECENT_SURGERIES: {
      has: {
        label: "Have you had any surgeries in the past 6 months?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" }
        ]
      },
      details: {
        label: "Please provide details about your recent surgeries"
      }
    },
    VISION_HEARING_ISSUES: {
      label: "Do you have any of the following vision or hearing issues?",
      options: [
        { value: "Sudden loss of vision", label: "Sudden loss of vision" },
        { value: "Retinitis pigmentosa", label: "Retinitis pigmentosa" },
        { value: "Sudden hearing loss", label: "Sudden hearing loss" },
        { value: "None of these", label: "None of these" }
      ]
    }
  },
  CURRENT_MEDICATIONS: {
    PRESCRIPTION_MEDICATIONS: {
      taking: {
        label: "Are you currently taking any medications?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" }
        ]
      },
      list: {
        label: "Please list all medications you are currently taking"
      }
    },
    NITRATES: {
      label: "Do you take nitrates (e.g., nitroglycerin)?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" }
      ]
    },
    ALPHA_BLOCKERS: {
      label: "Are you taking medications for blood pressure or prostate issues?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" }
      ]
    },
    SUPPLEMENTS: {
      taking: {
        label: "Are you using any herbal supplements or over-the-counter products?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" }
        ]
      },
      list: {
        label: "Please list all supplements or over-the-counter medications you are taking"
      }
    },
    CONDITIONS: {
      label: "Have you ever been diagnosed with or prescribed medication for any of the following conditions?",
      options: [
        { value: "Abnormal blood pressure, diabetes, or high cholesterol", label: "Abnormal blood pressure, diabetes, or high cholesterol" },
        { value: "Gastrointestinal, stomach or liver disorders", label: "Gastrointestinal, stomach or liver disorders" },
        { value: "Kidney problems", label: "Kidney problems" },
        { value: "Eye conditions or diseases", label: "Eye conditions or diseases" },
        { value: "Brain, spinal cord or nerve problems (including stroke and seizures)", label: "Brain, spinal cord or nerve problems (including stroke and seizures)" },
        { value: "Blood or immune system disorders (including HIV)", label: "Blood or immune system disorders (including HIV)" },
        { value: "Lung problems", label: "Lung problems" },
        { value: "None of these", label: "None of these" }
      ]
    }
  }
};

export const US_STATES = [
  { value: "AZ", label: "Arizona" },
  { value: "CA", label: "California" },
  { value: "FL", label: "Florida" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
  // Add more states as needed
];

export const ORDER_REVIEW_STATUS = {
  PENDING: "pending",
  IN_REVIEW: "in_review", 
  COMPLETED: "completed"
} as const;

export const REVIEW_STATUS_LABELS = {
  [ORDER_REVIEW_STATUS.PENDING]: "Pending Review",
  [ORDER_REVIEW_STATUS.IN_REVIEW]: "In Review",
  [ORDER_REVIEW_STATUS.COMPLETED]: "Completed"
} as const; 