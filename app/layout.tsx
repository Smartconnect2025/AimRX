import { UserProvider } from "@core/auth";
import type { Metadata } from "next";
import { DM_Sans, Unbounded } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SpecodeIframeTracker } from "@core/integrations/specode";
import { ClientNotificationProvider } from "@/features/notifications";
import "./theme.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-heading",
});

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
    <html lang="en" className={`${dmSans.variable} ${unbounded.variable}`}>
      <body className={`${dmSans.className} flex min-h-screen flex-col`}>
        <UserProvider>
          <ClientNotificationProvider>
            <SpecodeIframeTracker />
            {children}
            <Toaster />
          </ClientNotificationProvider>
        </UserProvider>
      </body>
    </html>
  );
}
