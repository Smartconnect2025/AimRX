import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface HipaaConsentDialogProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const HipaaConsentDialog = ({
  checked,
  onCheckedChange,
}: HipaaConsentDialogProps) => {
  return (
    <Dialog>
      <div className="flex items-start space-x-3">
        <Checkbox
          id="hipaa"
          checked={checked}
          onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
          className="mt-1"
        />
        <div className="grid gap-1.5 leading-none">
          <div className="flex items-center space-x-2">
            <label
              htmlFor="hipaa"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the
            </label>
            <DialogTrigger className="text-sm text-primary hover:underline">
              HIPAA Authorization
            </DialogTrigger>
            <span className="text-destructive">*</span>
          </div>
        </div>
      </div>
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-5xl bg-white !bg-opacity-100">
        <DialogHeader>
          <DialogTitle>HIPAA Authorization</DialogTitle>
          <DialogDescription>
            <div className="mt-4 space-y-4">
              <p>
                This authorization form allows us to use and disclose your
                protected health information (PHI) in accordance with the Health
                Insurance Portability and Accountability Act (HIPAA).
              </p>
              <h3 className="font-semibold mt-4">
                1. Authorization for PHI Use and Disclosure
              </h3>
              <p>
                I hereby authorize the use and disclosure of my protected health
                information (PHI) as described below. I understand that
                information disclosed pursuant to this authorization may be
                subject to redisclosure by the recipient and may no longer be
                protected by HIPAA privacy regulations.
              </p>
              <h3 className="font-semibold mt-4">
                2. Specific Uses and Disclosures
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Treatment, payment, and healthcare operations</li>
                <li>Coordination of care with other healthcare providers</li>
                <li>Quality assessment and improvement activities</li>
                <li>
                  Medical research (only with additional specific authorization)
                </li>
              </ul>
              <h3 className="font-semibold mt-4">
                3. Your Rights Regarding PHI
              </h3>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Request restrictions on certain uses and disclosures of your
                  PHI
                </li>
                <li>Receive confidential communications of PHI</li>
                <li>Inspect and copy your PHI</li>
                <li>Amend your PHI</li>
                <li>Receive an accounting of disclosures of PHI</li>
                <li>Obtain a paper copy of this notice</li>
              </ul>
              <h3 className="font-semibold mt-4">4. Duration</h3>
              <p>
                This authorization will remain in effect until you revoke it in
                writing.
              </p>
              <h3 className="font-semibold mt-4">5. Revocation Rights</h3>
              <p>
                You have the right to revoke this authorization at any time by
                sending written notification to our Privacy Officer. The
                revocation will take effect on the date it is received by our
                practice and will not apply to information that has already been
                used or disclosed pursuant to this authorization.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default HipaaConsentDialog;
