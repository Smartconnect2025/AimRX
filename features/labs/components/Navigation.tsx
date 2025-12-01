import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-background border-b border-border px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Desktop Menu Items */}
        <div className="flex items-center space-x-6">
          <Link
            href="/labs"
            className="text-foreground font-medium hidden sm:inline hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/labs/history"
            className="text-foreground font-medium hidden sm:inline hover:text-primary transition-colors"
          >
            Labs
          </Link>

          {/* Mobile Menu Trigger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-6">
                <Link
                  href="/"
                  className="text-foreground font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/labs"
                  className="text-foreground font-medium hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Labs
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          {/* User Initials Circle */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ backgroundColor: "#E2fafa", color: "#66cdcc" }}
          >
            JD
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
