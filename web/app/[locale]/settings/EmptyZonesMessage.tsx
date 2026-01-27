import { useTranslations } from "next-intl";

export default function EmptyZonesMessage() {
  const t = useTranslations("settings.zones");

  return <p className="text-neutral">{t("empty")}</p>;
}
