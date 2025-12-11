"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@core/supabase";
import { User, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@core/auth";
import { usePharmacy } from "@/contexts/PharmacyContext";
import { NotificationsPanel } from "@/features/notifications/components/NotificationsPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind-utils";

export function AdminHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userRole } = useUser();
  const { pharmacy } = usePharmacy();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLoginRedirect = () => {
    router.push("/auth");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/auth/login";
  };

  // Admin navigation - 6 main tabs
  const mainNavLinks = [
    { href: "/admin/pharmacy-management", label: "Pharmacies Management", hasButton: true, buttonLabel: "+ Add New Pharmacy", buttonHref: "/admin/pharmacy-management?action=add" },
    { href: "/admin/medication-catalog", label: "Medication Catalog", hasButton: true, buttonLabel: "+ Add Medication", buttonHref: "/admin/medication-catalog?action=add" },
    { href: "/admin/prescriptions", label: "Incoming Queue" },
    { href: "/admin/doctors", label: "Providers Management", hasButton: true, buttonLabel: "+ Invite Provider", buttonHref: "/admin/doctors?action=invite" },
    { href: "/admin/api-logs", label: "API & Logs" },
    { href: "/admin/settings", label: "Integration Settings" },
  ];

  const pharmacyColor = pharmacy?.primary_color || "#1E3A8A";

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full shadow-sm border-b"
        style={{
          backgroundColor: "#FFFFFF",
          borderBottomColor: pharmacyColor,
          borderBottomWidth: "3px"
        }}
      >
        <div className="container max-w-5xl px-4 md:px-4 justify-self-center">
          <div className="flex flex-col">
            {/* Logo/Title Row */}
            <div className="flex items-center justify-between py-3 border-b" style={{ borderBottomColor: `${pharmacyColor}33`, borderBottomWidth: "1px" }}>
              <Link href="/admin" className="flex items-center gap-3">
                <div className="text-3xl drop-shadow-2xl animate-pulse" style={{ color: "#00AEEF", textShadow: "0 0 20px rgba(0, 174, 239, 0.5)" }}>✝</div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold drop-shadow-lg" style={{ color: pharmacyColor }}>
                    {pharmacy ? pharmacy.name : "AIM Marketplace"}
                  </span>
                  {pharmacy?.tagline && (
                    <span className="text-xs italic" style={{ color: pharmacyColor, opacity: 0.7 }}>
                      {pharmacy.tagline}
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex items-center gap-3">
                {/* Notifications - Always Visible */}
                <NotificationsPanel />

                {/* Sign Out Button - Always Visible - Prominent */}
                {user && (
                  <Button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-[#00AEEF] hover:bg-[#0098D4] text-white font-semibold shadow-lg"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                )}

                {/* Desktop Profile Menu - Hidden on Tablet/Mobile */}
                {user ? (
                  <div className="hidden lg:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div
                          className="relative h-10 w-10 p-0 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full"
                        >
                          <User className="h-6 w-6" style={{ color: pharmacyColor }} />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[200px] border border-border"
                      >
                        <div className="px-2 pt-2 pb-2">
                          <p className="text-xs font-medium text-foreground">
                            Signed in as Admin
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {user.email && user.email.length > 20
                              ? `${user.email.substring(0, 24)}...`
                              : user.email}
                          </p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleLogout}>
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <Button onClick={handleLoginRedirect}>Sign In</Button>
                )}

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden hover:bg-gray-100 rounded-full"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" style={{ color: pharmacyColor }} />
                  ) : (
                    <Menu className="h-6 w-6" style={{ color: pharmacyColor }} />
                  )}
                </Button>
              </div>
            </div>

            {/* Navigation Row */}
            <div className="flex items-center py-3">
              {/* Desktop Navigation - Hidden on Tablet/Mobile */}
              {user && (
                <nav className="hidden lg:flex items-center gap-2">
                  {mainNavLinks.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      (link.href !== "/admin" &&
                        pathname.startsWith(link.href));

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "text-sm font-medium transition-all duration-200 px-3 py-2 rounded-md relative",
                          isActive
                            ? "bg-gray-100"
                            : "hover:bg-gray-50",
                        )}
                        style={isActive ? {
                          color: pharmacyColor,
                          borderBottom: `2px solid ${pharmacyColor}`
                        } : {
                          color: "#374151"
                        }}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "fixed top-24 right-0 h-[calc(100vh-6rem)] w-full max-w-sm bg-[#1E3A8A]/95 backdrop-blur-md z-40 transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl border-l-4 border-[#00AEEF]",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="h-full overflow-y-auto">
          {user && (
            <div className="p-4">
              {/* User Info Section */}
              <div className="pb-4 mb-4 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#00AEEF] flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {user.email && user.email.length > 25
                        ? `${user.email.substring(0, 25)}...`
                        : user.email}
                    </p>
                    {userRole === "admin" && (
                      <Badge className="mt-1 bg-[#00AEEF] text-white hover:bg-[#00AEEF]">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Navigation */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Main Menu
                </h3>
                <nav>
                  <ul className="space-y-1">
                    {mainNavLinks.map((link) => {
                      const isActive =
                        pathname === link.href ||
                        (link.href !== "/admin" &&
                          pathname.startsWith(link.href));

                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className={cn(
                              "block px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 relative",
                              isActive
                                ? "text-white bg-white/10 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[calc(100%-1.5rem)] after:h-0.5 after:bg-[#00AEEF] after:rounded-full"
                                : "text-white/80 hover:text-white hover:bg-white/5",
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                    <li className="pt-2 mt-2 border-t border-white/20">
                      <button
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 text-[#00AEEF] hover:text-white hover:bg-[#00AEEF] cursor-pointer"
                        onClick={handleLogout}
                      >
                        <User className="h-4 w-4" />
                        Sign Out
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
