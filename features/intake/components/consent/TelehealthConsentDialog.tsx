import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface TelehealthConsentDialogProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const TelehealthConsentDialog = ({
  checked,
  onCheckedChange,
}: TelehealthConsentDialogProps) => {
  return (
    <Dialog>
      <div className="flex items-start space-x-3">
        <Checkbox
          id="telehealth"
          checked={checked}
          onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
          className="mt-1"
        />
        <div className="grid gap-1.5 leading-none">
          <div className="flex items-center space-x-2">
            <label
              htmlFor="telehealth"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the
            </label>
            <DialogTrigger className="text-sm text-primary hover:underline">
              Telehealth Consent Form
            </DialogTrigger>
            <span className="text-destructive">*</span>
          </div>
        </div>
      </div>
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-5xl bg-white !bg-opacity-100">
        <DialogHeader>
          <DialogTitle>Telehealth Consent Form</DialogTitle>
          <DialogDescription>
            <div className="mt-4 space-y-4">
              <p>
                This Telehealth Consent Form outlines the rights and
                responsibilities of both the healthcare provider and the patient
                when engaging in telehealth services.
              </p>
              <p>
                By agreeing to this consent form, you acknowledge that you
                understand and agree to the following:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The nature and limitations of telehealth services</li>
                <li>Privacy and security considerations</li>
                <li>Your rights and responsibilities as a patient</li>
                <li>Emergency procedures and limitations</li>
              </ul>
              <h3 className="font-semibold mt-6">
                1. Nature of Telehealth Services
              </h3>
              <p>
                Telehealth involves the use of electronic communications to
                enable healthcare providers to share individual patient medical
                information for the purpose of improving patient care. The
                information may be used for diagnosis, therapy, follow-up and/or
                education.
              </p>
              <h3 className="font-semibold mt-4">2. Expected Benefits</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Improved access to medical care by enabling a patient to
                  remain at a remote site while consulting with a healthcare
                  provider
                </li>
                <li>More efficient medical evaluation and management</li>
                <li>Obtaining expertise of a specialist</li>
              </ul>
              <h3 className="font-semibold mt-4">3. Security Measures</h3>
              <p>
                We implement various security measures to maintain the safety of
                your personal health information. However, despite our best
                efforts, no security measures are perfect or impenetrable.
              </p>
              <h3 className="font-semibold mt-4">4. Possible Risks</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Delays in medical evaluation and treatment could occur due to
                  deficiencies or failures of the equipment
                </li>
                <li>
                  Security protocols could fail, causing a breach of privacy of
                  personal medical information
                </li>
                <li>
                  Lack of access to complete medical records may result in
                  adverse drug interactions or allergic reactions or other
                  medical judgment errors
                </li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default TelehealthConsentDialog;
