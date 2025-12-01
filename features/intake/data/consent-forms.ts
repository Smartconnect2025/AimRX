export const consentForms = [
  {
    id: "telehealth",
    title: "Telehealth Consent Form",
    linkText: "Telehealth Consent Form",
    content:
      "I understand and agree to receive healthcare services via telehealth technologies when appropriate. I understand the limitations and risks of telehealth services.",
  },
  {
    id: "hipaa",
    title: "HIPAA Authorization",
    linkText: "HIPAA Authorization",
    content:
      "I acknowledge that I have received and reviewed the Notice of Privacy Practices which explains how my medical information will be used and disclosed.",
  },
];

export const legalAgreements = [
  {
    id: "terms",
    title: "Terms of Service",
    content:
      "By using our services, you agree to be bound by these terms. We reserve the right to modify these terms at any time. Please read them carefully.",
  },
  {
    id: "liability",
    title: "Liability Waiver",
    content:
      "You understand and agree that we are not liable for any damages or injuries that may occur during your treatment.",
  },
];

export const treatmentConsents = [
  {
    id: "general_consent",
    title: "General Treatment Consent",
    content:
      "I hereby consent to receive medical treatment from healthcare providers and understand the risks and benefits associated with such treatment.",
  },
  {
    id: "telehealth",
    title: "Telehealth Services Consent",
    content:
      "I understand and agree to receive healthcare services via telehealth technologies when appropriate. I understand the limitations and risks of telehealth services.",
  },
];

export const privacyPolicies = [
  {
    id: "hipaa",
    title: "HIPAA Privacy Notice",
    content:
      "I acknowledge that I have received and reviewed the Notice of Privacy Practices which explains how my medical information will be used and disclosed.",
  },
  {
    id: "data_sharing",
    title: "Data Sharing Agreement",
    content:
      "I understand and agree that my medical information may be shared with other healthcare providers involved in my care and with my insurance provider as necessary.",
  },
];

// Comprehensive informed consent text for signature-based consent
export const informedConsentText = `INFORMED CONSENT FOR MEDICAL TREATMENT

I understand that no guarantee has been made by anyone as to the outcome or cure of my condition through treatment.

I consent to the administration of such treatment by the healthcare provider(s) and such associates, technical assistants and other healthcare providers who now or in the future treat me while a patient.

I consent to the disposal by hospital authorities of any tissue or parts which may be removed.

I am aware that the practice of medicine and surgery is not an exact science and I acknowledge that no guarantee has been made to me as to the outcome of the treatment or procedure.

I have been given the opportunity to ask questions about my condition, alternative forms of anesthesia and treatment, the procedures to be used, and the risks and hazards involved, and I believe that I have sufficient information to give this informed consent.

I understand the risks, benefits, and alternatives to the proposed treatment.

I voluntarily consent to the treatment that has been explained to me.

PATIENT RIGHTS AND RESPONSIBILITIES

As a patient, you have the right to:
- Receive considerate and respectful care
- Receive complete and current information about your diagnosis, treatment, and prognosis
- Know the identity of physicians, nurses, and others involved in your care
- Make decisions about the plan of care
- Privacy and confidentiality
- Access your medical records
- Receive information about hospital policies and procedures

As a patient, you have the responsibility to:
- Provide accurate and complete information about your health
- Follow the treatment plan
- Ask questions when you don't understand
- Inform healthcare providers if you believe you cannot follow the treatment plan
- Be considerate of other patients and hospital personnel
- Provide accurate insurance and financial information

PRIVACY NOTICE

This notice describes how medical information about you may be used and disclosed and how you can get access to this information. We are required by law to maintain the privacy of your health information and to provide you with this notice of our legal duties and privacy practices.

We may use and disclose your health information for treatment, payment, and healthcare operations. We may also use and disclose your health information for other purposes as permitted or required by law.

You have rights regarding your health information, including the right to request restrictions, the right to receive confidential communications, the right to inspect and copy your health information, and the right to request amendments.

By signing below, I acknowledge that I have read and understand this informed consent form and privacy notice. I consent to the treatment and understand my rights and responsibilities as a patient.`;

// Consent forms configuration for different usage modes
export const consentConfig = {
  signature: {
    title: "Informed Consent",
    text: informedConsentText,
    type: "informed_consent",
  },
  checkbox: {
    forms: consentForms,
    legalAgreements,
    treatmentConsents,
    privacyPolicies,
  },
};
