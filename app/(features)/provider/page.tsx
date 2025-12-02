import { redirect } from "next/navigation";

export default function ProviderPage() {
  redirect("/prescriptions/new/step1");
}
