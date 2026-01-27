import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/request";

// Redirect root path to default locale
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
