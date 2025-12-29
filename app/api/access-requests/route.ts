import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, formData } = body;

    if (!type || !formData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("⚠️ RESEND_API_KEY not configured - access request will be logged but not emailed");

      // Log the request to console for now
      console.log("📋 Access Request Received:", {
        type,
        timestamp: new Date().toISOString(),
        data: formData,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Request received successfully",
          note: "Email notifications are currently disabled"
        },
        { status: 200 }
      );
    }

    // Format email content based on request type
    let emailSubject = "";
    let emailContent = "";

    if (type === "doctor") {
      emailSubject = `New Provider Access Request - ${formData.firstName} ${formData.lastName}`;
      emailContent = `
        <h2>New Provider Access Request</h2>

        <h3>Personal Information</h3>
        <ul>
          <li><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</li>
          <li><strong>Email:</strong> ${formData.email}</li>
          <li><strong>Phone:</strong> ${formData.phone}</li>
        </ul>

        <h3>Medical Credentials</h3>
        <ul>
          <li><strong>NPI Number:</strong> ${formData.npiNumber}</li>
          <li><strong>Medical License:</strong> ${formData.medicalLicense}</li>
          <li><strong>License State:</strong> ${formData.licenseState}</li>
          <li><strong>Specialty:</strong> ${formData.specialty}</li>
        </ul>

        <h3>Practice Information</h3>
        <ul>
          <li><strong>Practice Name:</strong> ${formData.practiceName}</li>
          <li><strong>Address:</strong> ${formData.practiceAddress}, ${formData.city}, ${formData.state} ${formData.zipCode}</li>
          <li><strong>Years in Practice:</strong> ${formData.yearsInPractice}</li>
        </ul>

        <h3>Additional Information</h3>
        <ul>
          ${formData.patientsPerMonth ? `<li><strong>Patients Per Month:</strong> ${formData.patientsPerMonth}</li>` : ""}
          ${formData.interestedIn ? `<li><strong>Interested In:</strong> ${formData.interestedIn}</li>` : ""}
          ${formData.hearAboutUs ? `<li><strong>How They Heard About Us:</strong> ${formData.hearAboutUs}</li>` : ""}
          ${formData.additionalInfo ? `<li><strong>Additional Info:</strong> ${formData.additionalInfo}</li>` : ""}
        </ul>
      `;
    } else if (type === "pharmacy") {
      emailSubject = `New Pharmacy Network Application - ${formData.pharmacyName}`;
      emailContent = `
        <h2>New Pharmacy Network Application</h2>

        <h3>Pharmacy Information</h3>
        <ul>
          <li><strong>Pharmacy Name:</strong> ${formData.pharmacyName}</li>
          <li><strong>Owner/Director:</strong> ${formData.ownerName}</li>
          <li><strong>Email:</strong> ${formData.email}</li>
          <li><strong>Phone:</strong> ${formData.phone}</li>
        </ul>

        <h3>Licensing & Credentials</h3>
        <ul>
          <li><strong>License Number:</strong> ${formData.licenseNumber}</li>
          <li><strong>License State:</strong> ${formData.licenseState}</li>
          <li><strong>DEA Number:</strong> ${formData.deaNumber}</li>
          ${formData.ncpdpNumber ? `<li><strong>NCPDP Number:</strong> ${formData.ncpdpNumber}</li>` : ""}
          ${formData.accreditations ? `<li><strong>Accreditations:</strong> ${formData.accreditations}</li>` : ""}
        </ul>

        <h3>Location Information</h3>
        <ul>
          <li><strong>Address:</strong> ${formData.pharmacyAddress}, ${formData.city}, ${formData.state} ${formData.zipCode}</li>
        </ul>

        <h3>Compounding Capabilities</h3>
        <ul>
          <li><strong>Years in Business:</strong> ${formData.yearsInBusiness}</li>
          <li><strong>Compounding Experience:</strong> ${formData.compoundingExperience} years</li>
          ${formData.monthlyCapacity ? `<li><strong>Monthly Capacity:</strong> ${formData.monthlyCapacity}</li>` : ""}
          <li><strong>Specializations:</strong> ${formData.specializations}</li>
        </ul>

        <h3>System & Integration</h3>
        <ul>
          <li><strong>Current System:</strong> ${formData.currentSystem}</li>
          ${formData.systemVersion ? `<li><strong>System Version:</strong> ${formData.systemVersion}</li>` : ""}
          ${formData.integrationType ? `<li><strong>Preferred Integration:</strong> ${formData.integrationType}</li>` : ""}
        </ul>

        <h3>Additional Information</h3>
        <ul>
          ${formData.hearAboutUs ? `<li><strong>How They Heard About Us:</strong> ${formData.hearAboutUs}</li>` : ""}
          ${formData.additionalInfo ? `<li><strong>Additional Info:</strong> ${formData.additionalInfo}</li>` : ""}
        </ul>
      `;
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid request type" },
        { status: 400 }
      );
    }

    // Send email using Resend
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendApiKey);

      const { error } = await resend.emails.send({
        from: "AIM RX Portal <noreply@aimrx.com>",
        to: "support@aimrx.com",
        subject: emailSubject,
        html: emailContent,
      });

      if (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
          { success: false, error: "Failed to send email" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, message: "Request submitted successfully" },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Error with email service:", emailError);
      return NextResponse.json(
        { success: false, error: "Email service error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing access request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
