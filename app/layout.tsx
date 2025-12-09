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

// Cache-bust: v5.7.0 - Enhanced medication info display with all fields: pharmacy details, stock status, pricing, dosage, notes, timestamps, active status
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
