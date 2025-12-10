import { redirect } from "next/navigation";

export default function HomePage() {
  // Middleware will handle auth and role-based redirects
  // This should never render - middleware redirects happen before this
  redirect("/dashboard");
}
