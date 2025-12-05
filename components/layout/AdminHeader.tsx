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
import { NotificationsPanel } from "@/features/notifications/components/NotificationsPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind-utils";

export function AdminHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userRole } = useUser();
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

  // Check if user is platform owner (super admin / demo+admin)
  const isPlatformOwner = () => {
    const email = user?.email?.toLowerCase() || "";
    return (
      email.endsWith("@smartconnects.com") ||
      email === "joseph@smartconnects.com" ||
      email === "demo+admin@specode.ai" ||
      email === "platform@demo.com"
    );
  };

  // Admin-specific navigation links
  const mainNavLinks = [
    { href: "/admin/doctors", label: "Manage Doctors" },
    { href: "/admin/prescriptions", label: "Incoming Queue" },
    { href: "/basic-emr", label: "Patients & EMR" },
    { href: "/admin/medication-catalog", label: "Medication Catalog" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-border">
        <div className="container max-w-5xl h-16 px-4 md:px-4 justify-self-center">
          <div className="h-full flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <img
                src="https://i.imgur.com/r65O4DB.png"
                alt="AIM Medical Technologies"
                className="h-12 w-auto"
              />
              <Badge variant="secondary">
                {isPlatformOwner() ? "Platform Owner" : "Pharmacy Admin"}
              </Badge>
            </Link>

            <div className="flex items-center gap-4">
              {/* Desktop Navigation - Hidden on Tablet/Mobile */}
              {user && (
                <nav className="hidden lg:flex items-center gap-2 mr-4">
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
                            ? "text-foreground after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[calc(100%-1.5rem)] after:h-0.5 after:bg-primary after:rounded-full"
                            : "text-foreground/80 hover:text-foreground hover:bg-gray-200",
                        )}
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
                          {isPlatformOwner()
                            ? "Signed in as Platform Owner"
                            : "Signed in as Pharmacy Admin"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {user.email && user.email.length > 20
                            ? `${user.email.substring(0, 24)}...`
                            : user.email}
                        </p>
                      </div>
                      {isPlatformOwner() && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/super-admin">Platform Dashboard</Link>
                          </DropdownMenuItem>
                        </>
                      )}
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
          "fixed top-16 right-0 h-[calc(100vh-4rem)] w-full max-w-sm bg-white z-40 transform transition-transform duration-300 ease-in-out lg:hidden shadow-xl",
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
                    {userRole === "admin" && (
                      <Badge className="mt-1 bg-primary/10 text-primary hover:bg-primary/10">
                        {isPlatformOwner() ? "Platform Owner" : "Pharmacy Admin"}
                      </Badge>
                    )}
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
                    <li>
                      <button
                        className="w-full text-left block px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 text-foreground/80 hover:text-foreground hover:bg-gray-200 cursor-pointer"
                        onClick={handleLogout}
                      >
                        Sign out
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>

              {/* Platform Owner Access */}
              {isPlatformOwner() && (
                <div className="">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Platform Owner
                  </h3>
                  <nav>
                    <ul className="space-y-1">
                      <li>
                        <Link
                          href="/super-admin"
                          className={cn(
                            "block px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 relative",
                            pathname === "/super-admin"
                              ? "text-foreground after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[calc(100%-1.5rem)] after:h-0.5 after:bg-primary after:rounded-full"
                              : "text-foreground/80 hover:text-foreground hover:bg-gray-200",
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Platform Dashboard
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
