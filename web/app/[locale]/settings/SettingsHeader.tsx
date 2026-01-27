import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function SettingsHeader() {
  const t = useTranslations("common");
  const tSettings = useTranslations("settings");

  return (
    <div className="mb-8">
      <Link
        href="/"
        className="text-sm text-primary hover:text-primary-hover mb-4 inline-block"
      >
        ← Home
      </Link>
      <h1 className="text-3xl font-bold text-gray-900">{tSettings("title")}</h1>
    </div>
  );
}
