import { UserProvider } from "@core/auth";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SpecodeIframeTracker } from "@core/integrations/specode";
import { ClientNotificationProvider } from "@/features/notifications";
import { PharmacyProvider } from "@/contexts/PharmacyContext";
import "./theme.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

// Cache-bust: v9.0.0 - Unified gradient design across entire app with MFA implementation
export const metadata: Metadata = {
  title: "Components Foundation",
  description: "",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} flex min-h-screen flex-col bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#00AEEF] relative overflow-x-hidden`}>
        {/* Subtle animated helix/DNA background */}
        <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        </div>

        <UserProvider>
          <PharmacyProvider>
            <ClientNotificationProvider>
              <SpecodeIframeTracker />
              <div className="relative z-10 flex min-h-screen flex-col">
                {children}
              </div>
              <Toaster />
            </ClientNotificationProvider>
          </PharmacyProvider>
        </UserProvider>
      </body>
    </html>
  );
}
