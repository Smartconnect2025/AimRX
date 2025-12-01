import * as z from "zod";

export const states = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const;

export const patientInformationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  sexAtBirth: z.enum(["male", "female"], {
    required_error: "Sex at birth is required",
  }),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z
      .string()
      .min(1, "ZIP code is required")
      .regex(/^\d{5}$/, "Invalid ZIP code"),
  }),
  contact: z.object({
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Invalid phone number"),
  }),
  preferredLanguage: z.enum(["english", "spanish"], {
    required_error: "Preferred language is required",
  }),
  height: z.object({
    feet: z
      .number({
        required_error: "Height feet is required",
        invalid_type_error: "Invalid height feet",
      })
      .min(2, "Invalid height feet")
      .max(8, "Invalid height feet"),
    inches: z
      .number({
        required_error: "Height inches is required",
        invalid_type_error: "Invalid height inches",
      })
      .min(0, "Invalid height inches")
      .max(11, "Invalid height inches"),
  }),
  weight: z
    .number({
      required_error: "Weight is required",
      invalid_type_error: "Invalid weight",
    })
    .min(1, "Invalid weight")
    .max(1000, "Invalid weight"),
});

export type PatientInformationFormValues = z.infer<
  typeof patientInformationSchema
>;
