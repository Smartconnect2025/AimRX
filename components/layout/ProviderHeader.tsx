"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
import { useUser } from "@core/auth";
import { usePharmacy } from "@/contexts/PharmacyContext";
import { NotificationsPanel } from "@/features/notifications/components/NotificationsPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind-utils";

export function ProviderHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [providerName, setProviderName] = useState<string>("");
  const { user } = useUser();
  const { pharmacy } = usePharmacy();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Load provider name
  useEffect(() => {
    const loadProviderName = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from("providers")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProviderName(`Dr. ${data.first_name} ${data.last_name}`);
      }
    };

    loadProviderName();
  }, [user?.id, supabase]);

  const handleLoginRedirect = () => {
    router.push("/auth");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/auth/login";
  };

  // Provider-specific navigation links
  const mainNavLinks = [
    { href: "/prescriptions", label: "Prescriptions" },
    { href: "/prescriptions/new/step1", label: "Prescribe" },
    { href: "/basic-emr", label: "Patients" },
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
        <div className="container max-w-5xl h-24 px-4 md:px-4 justify-self-center">
          <div className="h-full flex items-center justify-between">
            <Link href="/prescriptions/new/step1" className="flex items-center gap-3 py-2">
              {pharmacy ? (
                <div className="flex flex-col">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: pharmacyColor }}
                  >
                    {pharmacy.name}
                  </span>
                  {pharmacy.tagline && (
                    <span className="text-sm text-gray-600 italic">
                      {pharmacy.tagline}
                    </span>
                  )}
                </div>
              ) : (
                <img
                  src="https://i.imgur.com/r65O4DB.png"
                  alt="Portal"
                  className="h-20 w-auto"
                />
              )}
            </Link>

            <div className="flex items-center gap-4">
              {/* Desktop Navigation - Hidden on Tablet/Mobile */}
              {user && (
                <nav className="hidden lg:flex items-center gap-2 mr-4">
                  {mainNavLinks.map((link) => {
                    let isActive = false;

                    if (link.href === "/prescriptions") {
                      // Prescriptions tab active when on /prescriptions exactly (not /prescriptions/new)
                      isActive = pathname === "/prescriptions";
                    } else if (link.href === "/prescriptions/new/step1") {
                      // Prescribe tab active when on /prescriptions/new/...
                      isActive = pathname.startsWith("/prescriptions/new");
                    } else if (link.href === "/basic-emr") {
                      // Patients tab active when on /basic-emr or /patients
                      isActive = pathname.startsWith("/basic-emr") || pathname.startsWith("/patients");
                    } else {
                      // Default behavior for other tabs
                      isActive = pathname === link.href || pathname.startsWith(link.href);
                    }

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "text-sm font-medium transition-all duration-200 px-3 py-2 rounded-md relative",
                          isActive
                            ? "text-foreground"
                            : "text-foreground/80 hover:text-foreground hover:bg-gray-200",
                        )}
                        style={isActive ? {
                          borderBottom: `2px solid ${pharmacyColor}`
                        } : undefined}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              )}

              {/* Notifications - Always Visible */}
              <NotificationsPanel />

              {/* Desktop Profile Menu - Hidden on Tablet/Mobile */}
              {user ? (
                <div className="hidden lg:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div
                        className="relative h-10 w-10 p-0 flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded-full"
                      >
                        <User className="h-6 w-6" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-[200px] border border-border"
                    >
                      <div className="px-2 pt-2 pb-2">
                        <p className="text-xs font-medium text-foreground">
                          {providerName || "Provider"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {user.email && user.email.length > 20
                            ? `${user.email.substring(0, 24)}...`
                            : user.email}
                        </p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/provider/profile">Profile</Link>
                      </DropdownMenuItem>
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
                className="lg:hidden hover:bg-gray-200 rounded-full"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "fixed top-24 right-0 h-[calc(100vh-6rem)] w-full max-w-sm bg-white z-40 transform transition-transform duration-300 ease-in-out lg:hidden shadow-xl",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="h-full overflow-y-auto">
          {user && (
            <div className="p-4">
              {/* User Info Section */}
              <div className="pb-4 mb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {user.email && user.email.length > 25
                        ? `${user.email.substring(0, 25)}...`
                        : user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Navigation */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Main Menu
                </h3>
                <nav>
                  <ul className="space-y-1">
                    {mainNavLinks.map((link) => {
                      let isActive = false;

                      if (link.href === "/prescriptions") {
                        // Prescriptions tab active when on /prescriptions exactly (not /prescriptions/new)
                        isActive = pathname === "/prescriptions";
                      } else if (link.href === "/prescriptions/new/step1") {
                        // Prescribe tab active when on /prescriptions/new/...
                        isActive = pathname.startsWith("/prescriptions/new");
                      } else if (link.href === "/basic-emr") {
                        // Patients tab active when on /basic-emr or /patients
                        isActive = pathname.startsWith("/basic-emr") || pathname.startsWith("/patients");
                      } else {
                        // Default behavior for other tabs
                        isActive = pathname === link.href || pathname.startsWith(link.href);
                      }

                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className={cn(
                              "text-sm font-medium transition-all duration-200 px-3 py-2 rounded-md relative",
                              isActive
                                ? "text-foreground after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[calc(100%-1.5rem)] after:h-0.5 after:bg-primary after:rounded-full"
                                : "text-foreground/80 hover:text-foreground hover:bg-gray-200",
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>

              {/* Profile Navigation */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Account
                </h3>
                <nav>
                  <ul className="space-y-1">
                    <li>
                      <Link
                        href="/provider/profile"
                        className={cn(
                          "block px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 relative",
                          pathname === "/provider/profile"
                            ? "text-foreground after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[calc(100%-1.5rem)] after:h-0.5 after:bg-primary after:rounded-full"
                            : "text-foreground/80 hover:text-foreground hover:bg-gray-200",
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>

              {/* Sign Out */}
              <div className="pt-4">
                <button
                  className="block px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer"
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
