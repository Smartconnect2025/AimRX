import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col ">
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-border">
        <div className="container mx-auto h-16 px-4 md:px-4 justify-self-center">
          <div className="h-full w-full flex items-center justify-center">
            <div className="cursor-pointer">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={120}
                height={28}
                priority
                className="w-auto"
              />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense
          fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}
        >
          <div className="w-full md:max-w-[500px] bg-white rounded-lg p-4 md:p-12 shadow-sm">
            {children}
          </div>
        </Suspense>
      </main>
    </div>
  );
}
