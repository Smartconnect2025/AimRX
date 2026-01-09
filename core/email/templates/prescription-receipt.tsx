import * as React from 'react';

interface OversightFee {
  fee: string;
  reason: string;
}

interface PrescriptionReceiptEmailProps {
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
  patientPrice?: string;
  oversightFees?: OversightFee[];
}

export const PrescriptionReceiptEmail: React.FC<PrescriptionReceiptEmailProps> = ({
  queueId,
  patientName,
  patientDOB,
  dateTime,
  doctorName,
  medication,
  strength,
  quantity,
  sig,
  pharmacyNotes,
  patientPrice,
  oversightFees = [],
}) => {
  // Calculate totals
  const medicationPrice = patientPrice ? parseFloat(patientPrice) : 0;
  const totalOversightFees = oversightFees.reduce((sum, item) => sum + parseFloat(item.fee || '0'), 0);
  const totalPatientCost = medicationPrice + totalOversightFees;

  // Fee reason labels
  const reasonLabels: Record<string, string> = {
    dose_titration: 'Dose Titration & Adjustment',
    side_effect_monitoring: 'Side Effect & Safety Monitoring',
    therapeutic_response: 'Therapeutic Response Review',
    adherence_tracking: 'Medication Adherence Tracking',
    contraindication_screening: 'Contraindication Screening',
  };

  return (
  <html>
    <head>
      <meta charSet="utf-8" />
    </head>
    <body style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* AIM Logo */}
      <div style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
        <img
          src="https://i.imgur.com/r65O4DB.png"
          alt="AIM Medical Technologies"
          style={{ height: '140px' }}
        />
      </div>

      {/* Letterhead */}
      <div style={{ textAlign: 'center', fontSize: '14px', color: '#666', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
        <p style={{ fontWeight: '600', color: '#111', margin: '0 0 8px 0' }}>AIM Medical Technologies</p>
        <p style={{ margin: '0' }}>106 E 6th St, Suite 900 · Austin, TX 78701</p>
        <p style={{ margin: '0' }}>(512) 377-9898 · Mon–Fri 9AM–6PM CST</p>
      </div>

      {/* Success Message */}
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ display: 'inline-block', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#00AEEF20', marginBottom: '16px' }}>
          <span style={{ fontSize: '40px', color: '#00AEEF' }}>✓</span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#00AEEF', margin: '0' }}>
          Order Successfully Submitted
        </h2>
      </div>

      {/* Reference Information */}
      <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 4px 0' }}>Reference #</p>
          <p style={{ fontWeight: 'bold', fontSize: '18px', margin: '0' }}>{queueId}</p>
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginBottom: '12px' }}>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 4px 0' }}>Patient</p>
            <p style={{ fontWeight: '500', margin: '0' }}>{patientName}</p>
            {patientDOB && (
              <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0 0' }}>
                DOB: {new Date(patientDOB).toLocaleDateString()}
              </p>
            )}
          </div>
          <div>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 4px 0' }}>Date</p>
            <p style={{ fontWeight: '500', margin: '0' }}>{new Date(dateTime).toLocaleString()}</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 4px 0' }}>Prescribed by</p>
          <p style={{ fontWeight: '500', margin: '0' }}>{doctorName}</p>
        </div>
      </div>

      {/* Production Status */}
      <div style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '20px', color: '#00AEEF' }}>⏱</span>
          <div>
            <h3 style={{ fontWeight: '600', color: '#111', margin: '0 0 8px 0' }}>In Production</h3>
            <p style={{ fontSize: '14px', color: '#111', margin: '0 0 8px 0' }}>
              Your custom regenerative therapy is being freshly compounded at AIM&apos;s lab.
            </p>
            <p style={{ fontSize: '14px', color: '#111', margin: '0 0 8px 0' }}>
              <strong>Typical preparation time:</strong> 5–10 business days
            </p>
            <p style={{ fontSize: '14px', color: '#111', margin: '0' }}>
              We will text or email you as soon as it&apos;s ready for pickup or shipping.
            </p>
          </div>
        </div>
      </div>

      {/* Medication Details */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#00AEEF', marginBottom: '12px' }}>
          Medication Details
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Medication</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Strength</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>SIG</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', fontWeight: '500' }}>{medication}</td>
              <td style={{ padding: '12px' }}>{strength}</td>
              <td style={{ padding: '12px' }}>{quantity}</td>
              <td style={{ padding: '12px', fontSize: '14px' }}>{sig}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {pharmacyNotes && (
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
          <p style={{ fontWeight: '600', fontSize: '14px', color: '#374151', margin: '0 0 4px 0' }}>Notes:</p>
          <p style={{ fontSize: '14px', color: '#111', margin: '0' }}>{pharmacyNotes}</p>
        </div>
      )}

      {/* Price of Medication */}
      {patientPrice && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#00AEEF', marginBottom: '12px' }}>
            Price of Medication
          </h3>
          <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#111', margin: '0' }}>Medication Cost</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', margin: '0' }}>
                ${medicationPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Oversight & Monitoring Fees */}
      {oversightFees.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#00AEEF', marginBottom: '12px' }}>
            Medication Oversight & Monitoring Fees
          </h3>
          {oversightFees.map((item, index) => (
            <div key={index} style={{ backgroundColor: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Reason</p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#111', margin: '0' }}>
                    {reasonLabels[item.reason] || item.reason}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Fee Amount</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb', margin: '0' }}>
                    ${parseFloat(item.fee).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Total Oversight Fees */}
          <div style={{ backgroundColor: '#bfdbfe', border: '2px solid #3b82f6', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#111', margin: '0' }}>Total Oversight Fees</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', margin: '0' }}>
                ${totalOversightFees.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Total Patient Cost */}
      {(patientPrice || oversightFees.length > 0) && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ background: 'linear-gradient(to right, #dcfce7, #dbeafe)', border: '2px solid #16a34a', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111', margin: '0' }}>Total Patient Cost</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111', margin: '0' }}>
                ${totalPatientCost.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Location */}
      <div style={{ border: '2px solid #00AEEF', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '20px', color: '#00AEEF' }}>📍</span>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#00AEEF', margin: '0 0 8px 0' }}>
              Pickup Location
            </h3>
            <p style={{ fontWeight: '600', color: '#111', margin: '0 0 4px 0' }}>AIM Medical Technologies</p>
            <a
              href="https://maps.google.com/?q=106+E+6th+St+Suite+900+Austin+TX+78701"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '14px', color: '#00AEEF', textDecoration: 'none', display: 'inline-block', marginTop: '4px' }}
            >
              106 E 6th St, Suite 900, Austin, TX 78701 →
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '12px', color: '#666', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ margin: '0' }}>© 2025 AIM Medical Technologies – Elevating patient care with AI-driven clinical innovations</p>
        <p style={{ margin: '8px 0 0 0' }}>
          Questions? Contact us at (512) 377-9898 or visit our office during business hours.
        </p>
      </div>
    </body>
  </html>
  );
};
