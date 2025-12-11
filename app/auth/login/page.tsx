"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@core/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { crmEventTriggers } from "@/core/services/crm";
import { Eye, EyeOff } from "lucide-react";

const SAFE_ACTIVITY_MESSAGES = [
  "A provider just placed an order",
  "New clinic joined the network",
  "Peptide prescription received",
  "Regenerative therapy in process",
  "Another pharmacy activated their account",
  "Provider consultation completed",
  "Compounding request submitted",
  "New regenerative treatment started",
];

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const supabase = createClient();
  const redirectUrl = decodeURIComponent(searchParams.get("redirect") || "/");

  // Fade in on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Rotate activity messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % SAFE_ACTIVITY_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (data.user?.id && data.user?.email) {
        // Send Login event to CRM (non-blocking)
        crmEventTriggers.userLoggedIn(data.user.id, data.user.email);
      }

      // Check if user has MFA enabled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasMFA = factors?.totp?.some((f) => f.status === "verified");

      if (hasMFA) {
        // Redirect to MFA verification page
        router.push(`/auth/mfa-verify?redirect=${encodeURIComponent(redirectUrl || "/")}`);
        return;
      }

      toast.success("You have successfully logged in.");

      // Navigate to home - let middleware handle role-based routing and intake checks
      router.push(redirectUrl || "/");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#00AEEF] overflow-hidden flex flex-col relative">
        {/* Subtle animated helix/DNA background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        </div>

        {/* Top-center logo and headline - COMPACT */}
        <div className="pt-6 pb-2 text-center z-10">
          {/* HIPAA Trust Badge - Top Center on mobile, Top Right on desktop */}
          <div className="flex justify-center md:justify-end mb-4 px-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-2xl border-2 border-green-500/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">HIPAA Compliant</div>
                  <div className="text-[10px] text-gray-600">Secure & Private</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {/* AIM SVG Logo */}
            <div className="drop-shadow-2xl animate-pulse" style={{ filter: "drop-shadow(0 0 30px rgba(0, 174, 239, 0.6))" }}>
              <svg width="80" height="80" viewBox="0 0 1500 1500" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0 C20.31434182 16.53035798 33.4149859 42.5322558 39.34521484 67.76318359 C39.79380859 69.6484375 39.79380859 69.6484375 40.25146484 71.57177734 C48.03854399 107.45187164 36.98269374 140.05503496 20.44921875 171.53686523 C18.35071523 175.76867717 17.94696481 179.06383315 18.34521484 183.76318359 C20.74355895 188.55987181 24.21642128 191.50283498 28.23974609 194.89208984 C31.59058856 197.86992573 34.686302 201.14872395 37.34521484 204.76318359 C37.34521484 205.42318359 37.34521484 206.08318359 37.34521484 206.76318359 C37.92658203 207.03259766 38.50794922 207.30201172 39.10693359 207.57958984 C42.04542661 209.13345264 44.4713708 211.14736293 47.05224609 213.22802734 C55.13061863 218.63654592 63.96831968 219.28540683 73.34521484 217.76318359 C80.45869818 215.85965737 87.33008631 213.22498888 94.16308594 210.49755859 C96.34521484 209.76318359 96.34521484 209.76318359 99.34521484 209.76318359 C99.34521484 206.79318359 99.34521484 203.82318359 99.34521484 200.76318359 C126.49177192 200.66977739 153.63830495 200.59922253 180.78499031 200.55593491 C193.38942967 200.53530225 205.99376923 200.50716805 218.59814453 200.46142578 C229.58302911 200.42157974 240.56784141 200.39575591 251.55279624 200.38682961 C257.3702507 200.38161113 263.18749839 200.36933086 269.00488663 200.34026337 C274.47955719 200.31312974 279.95393565 200.30473454 285.42866707 200.31075287 C287.43863448 200.30965172 289.44861159 200.30168577 291.45852089 200.28636169 C294.20245312 200.26646604 296.94528184 200.27124293 299.6892395 200.28216553 C300.48497065 200.27051416 301.28070179 200.2588628 302.100546 200.24685836 C307.29259604 200.30273922 310.20300242 201.36785185 314.34521484 204.76318359 C315.68887329 206.59550476 315.68887329 206.59550476 316.51171875 208.46508789 C316.82457825 209.16411224 317.13743774 209.8631366 317.45977783 210.58334351 C318.93369812 214.21195907 320.34846414 217.84960329 321.68115234 221.53271484 C321.99271774 222.38123016 322.30428314 223.22974548 322.62528992 224.10397339 C323.30338569 225.9519978 323.9794126 227.80078238 324.65359497 229.65023804 C326.52675653 234.78780607 328.41594881 239.91948982 330.30224609 245.05224609 C330.70477097 246.14891098 331.10729584 247.24557587 331.52201843 248.37547302 C336.20240009 261.1183598 340.95032803 273.83602228 345.6993103 286.55345917 C347.59305353 291.62521647 349.48558565 296.69742597 351.37834549 301.76955032 C352.07178925 303.62774806 352.7653103 305.48591696 353.45883179 307.34408569 C356.13024735 314.50281695 358.79751962 321.66306562 361.45849609 328.82568359 C361.7741452 329.67525131 362.08979431 330.52481903 362.41500854 331.40013123 C363.04059558 333.08396136 363.6661755 334.76779413 364.29174805 336.45162964 C364.59814209 337.27631744 364.90453613 338.10100525 365.22021484 338.95068359 C365.52644775 339.77496857 365.83268066 340.59925354 366.14819336 341.44851685 C370.45592692 353.03964714 374.78962104 364.62091337 379.13818359 376.19677734 C379.65308932 377.56758006 380.16799205 378.9383839 380.68289185 380.30918884 C380.94004534 380.99378835 381.19719883 381.67838785 381.46214485 382.3837328 C382.7773842 385.88519786 384.09258847 389.38667609 385.40771484 392.88818359 C385.79926758 393.93064554 385.79926758 393.93064554 386.19873047 394.99416733 C392.60777304 412.05904233 398.98728406 429.13298194 405.22021484 446.26318359 C410.64487845 461.17129092 416.17671607 476.03637617 421.76141357 490.88525391 C428.72323275 509.39852759 435.61848889 527.93603537 442.49814224 546.47994995 C450.28996537 567.48234417 458.09293243 588.4801455 465.97021484 609.45068359 C472.00552256 625.5180012 478.01724351 641.59372305 483.9921875 657.68359375 C487.80186947 667.94030082 491.62629546 678.19137911 495.4643631 688.43749428 C496.99867108 692.53453693 498.53124543 696.6322285 500.06385422 700.72990704 C501.57467106 704.76864731 503.08834357 708.80630296 504.60400009 712.84322929 C505.31972316 714.75113016 506.03394768 716.65958375 506.74749756 718.56829834 C507.6289584 720.92613924 508.51285233 723.28307235 509.3994751 725.63897705 C509.78891296 726.6829364 510.17835083 727.72689575 510.57958984 728.80249023 C510.9221582 729.71648087 511.26472656 730.6304715 511.61767578 731.57215881 C512.34521484 733.76318359 512.34521484 733.76318359 512.34521484 735.76318359 C513.00521484 735.76318359 513.66521484 735.76318359 514.34521484 735.76318359 C514.4820166 735.1844751 514.61881836 734.6057666 514.75976562 734.00952148 C516.94528031 725.39032674 520.06176859 717.18076824 523.20666504 708.87854004 C525.00787513 704.11964016 526.78985761 699.35355244 528.57177734 694.58740234 C528.95466919 693.56369537 529.33756104 692.5399884 529.73205566 691.48526001 C534.44354525 678.86079381 539.01871707 666.1870655 543.59521484 653.51318359 C544.4879376 651.04198564 545.38067859 648.57079427 546.2734375 646.09960938 C547.62281726 642.36429044 548.97213854 638.62895051 550.32113647 634.89349365 C554.64198238 622.93251279 558.98772744 610.98064221 563.33773804 599.03024292 C569.83656002 581.17658074 576.32350222 563.31871613 582.78271484 545.45068359 C583.12160736 544.51321289 583.46049988 543.57574219 583.80966187 542.60986328 C585.20376856 538.75318571 586.59778943 534.89647712 587.99171448 531.03973389 C598.81835862 501.08604385 609.65530665 471.13598183 620.53271484 441.20068359 C620.85072052 440.32545044 621.1687262 439.45021729 621.49636841 438.54846191 C625.2322638 428.27063282 628.98916196 418.00076356 632.77099609 407.73974609 C640.35370665 387.1632237 647.87565748 366.57090246 655.18994141 345.89727783 C663.28642565 323.01954316 671.60349754 300.22274245 679.91748047 277.42333984 C683.31426382 268.1070674 686.7018063 258.78743713 690.08935547 249.46780396 C691.04946716 246.82653553 692.00978421 244.18534191 692.97021484 241.54418945 C693.41850647 240.31026207 693.41850647 240.31026207 693.87585449 239.05140686 C694.46374905 237.43635759 695.05363143 235.82203033 695.64562988 234.20848083 C697.27934614 229.74662385 698.86220979 225.2720019 700.39794922 220.77539062 C700.92017059 219.27329796 700.92017059 219.27329796 701.45294189 217.74085999 C702.1250789 215.80574049 702.78490184 213.86628515 703.43035889 211.92210388 C703.73773987 211.04538528 704.04512085 210.16866669 704.36181641 209.26538086 C704.62464417 208.49154556 704.88747192 207.71771027 705.15826416 206.92042542 C706.8040596 203.92924912 708.46613656 202.62139046 711.34521484 200.76318359" fill="#00AEEF" transform="translate(700,300) scale(0.12)"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-2xl">AIM Marketplace</h1>
            <p className="text-lg text-white/90 font-semibold">The Amazon of Regenerative Medicine</p>
            <p className="text-base text-white/95 italic max-w-2xl mt-2 font-medium">&quot;Elevating Patient Care with AI-Driven Clinical Innovations&quot;</p>
          </div>
        </div>

        {/* Centered login card with fade-in - COMPACT */}
        <div className={`flex-1 flex flex-col items-center justify-center px-4 py-4 z-10 transition-opacity duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
              <p className="text-sm text-gray-600">Sign in to access the marketplace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder=""
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-[#00AEEF] hover:text-[#0098D4]"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold bg-[#00AEEF] hover:bg-[#00AEEF] text-white shadow-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,174,239,0.6)]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  "SIGN IN"
                )}
              </Button>
            </form>

            {/* Invitation Only Message */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Invitation Only
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Access by invitation or request below</p>
            </div>
            </div>
          </div>

          {/* Elegant Access Request Cards - COMPACT */}
          <div className="mt-4 flex flex-col md:flex-row gap-4 w-full max-w-4xl">
            {/* Doctor Card */}
            <Link href="/request-doctor-access" className="block group flex-1">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-xl border-2 border-[#00AEEF]/20 hover:border-[#00AEEF] transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:shadow-[0_0_25px_rgba(0,174,239,0.4)]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#0098D4] flex items-center justify-center text-white text-lg font-bold group-hover:scale-110 transition-transform duration-300">
                    Dr
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#00AEEF] transition-colors">For Doctors</h3>
                    <p className="text-xs text-gray-600">Join the network</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">Empower your practice with regenerative medicine. Access peptides, PRP, and more.</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#00AEEF] font-semibold group-hover:translate-x-2 transition-transform">Request Provider Access →</span>
                </div>
              </div>
            </Link>

            {/* Pharmacy Card */}
            <Link href="/request-pharmacy-access" className="block group flex-1">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-xl border-2 border-[#1E3A8A]/20 hover:border-[#1E3A8A] transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:shadow-[0_0_25px_rgba(30,58,138,0.4)]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center text-white text-lg font-bold group-hover:scale-110 transition-transform duration-300">
                    Rx
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#1E3A8A] transition-colors">For Pharmacies</h3>
                    <p className="text-xs text-gray-600">Grow your business</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">Join AIM&apos;s regenerative network and receive orders from providers nationwide.</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#1E3A8A] font-semibold group-hover:translate-x-2 transition-transform">Apply to Join Network →</span>
                </div>
              </div>
            </Link>
          </div>
        </div>


        {/* Bottom section */}
        <div className="mt-auto z-10">
          {/* Bottom live activity bar - smooth scroll */}
          <div className="bg-black/40 backdrop-blur-md border-t border-white/10 py-4 overflow-hidden">
            <div className="relative">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-white">
                  <span className="animate-pulse text-green-400 text-xl">●</span>
                  <span className="text-sm font-medium text-white/90 transition-all duration-500">
                    {SAFE_ACTIVITY_MESSAGES[currentMessage]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-3 text-white text-xs">
            By invitation only • Built exclusively for AIM Medical Technologies
          </div>
        </div>
    </div>
  );
}
