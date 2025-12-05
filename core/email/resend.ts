import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
// For demo purposes, we'll use a placeholder if not configured
const resendApiKey = process.env.RESEND_API_KEY || 'demo-key';

export const resend = new Resend(resendApiKey);

/**
 * Send prescription receipt email to patient
 */
export async function sendPrescriptionReceiptEmail(
  patientEmail: string,
  prescriptionData: {
    queueId: string;
    patientName: string;
    patientDOB?: string;
    dateTime: string;
    doctorName: string;
    medication: string;
    strength: string;
    quantity: number;
    sig: string;
    pharmacyNotes?: string;
  }
) {
  try {
    // If no API key is configured, log the email details but don't send
    if (resendApiKey === 'demo-key') {
      console.log('📧 [DEMO MODE] Would send prescription receipt email to:', patientEmail);
      console.log('📧 Email data:', prescriptionData);
      return {
        success: true,
        message: 'Email logged (demo mode - no actual email sent)',
      };
    }

    const { PrescriptionReceiptEmail } = await import('./templates/prescription-receipt');

    const { data, error } = await resend.emails.send({
      from: 'AIM Medical Technologies <noreply@aimmedical.com>',
      to: patientEmail,
      subject: `AIM Order Confirmation - Ref# ${prescriptionData.queueId}`,
      react: PrescriptionReceiptEmail(prescriptionData) as React.ReactElement,
    });

    if (error) {
      console.error('❌ Failed to send prescription receipt email:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Prescription receipt email sent successfully:', data);
    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error('❌ Error sending prescription receipt email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
