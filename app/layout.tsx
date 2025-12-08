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

// Cache-bust: v5.3.0 - MONEY CARDS: Huge +$360 profit badge (biggest), "Prescribe & Charge $720" button, "Money in bank in seconds" + "Save patient 68%" tags, profit-first visual hierarchy
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
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <UserProvider>
          <PharmacyProvider>
            <ClientNotificationProvider>
              <SpecodeIframeTracker />
              {children}
              <Toaster />
            </ClientNotificationProvider>
          </PharmacyProvider>
        </UserProvider>
      </body>
    </html>
  );
}
