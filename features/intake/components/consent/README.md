# Consent Forms

This feature handles both checkbox-based and signature-based consent collection during the intake
process.

## Components

### SignatureConsentForm

Complete consent form with electronic signature capture.

**Features:**

- Electronic signature capture (mouse and touch support)
- Consent text scrolling area
- Read confirmation checkbox
- Signature validation
- Database storage with audit trail
- Base64 signature encoding

### ConsentSection

Reusable component for checkbox-based consent forms.

## Backend-Controlled Mode

The consent mode is controlled by an environment variable:

```bash
# .env
USE_SIGNATURE_CONSENT=true   # Use signature consent
USE_SIGNATURE_CONSENT=false  # Use checkbox consent (default)
```

## Usage

The consent page automatically renders the appropriate mode based on the environment variable. No
code changes needed to switch modes.

### Custom Consent Text

Edit `data/consent-forms.ts` to customize the consent text:

```typescript
export const informedConsentText = `
YOUR CUSTOM CONSENT TEXT HERE...
`;
```

## Data Storage

- **Signature Mode**: Stores in `patients.data.signature_consent`
- **Checkbox Mode**: Stores in `patients.data.checkbox_consent`

Both modes set `consent_completed_at` when completed.
