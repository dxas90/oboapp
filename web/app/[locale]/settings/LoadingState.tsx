import { useTranslations } from "next-intl";

export default function LoadingState() {
  const t = useTranslations("common");

  return (
    <div className="min-h-screen bg-neutral-light flex items-center justify-center">
      <div className="text-neutral">{t("loading")}</div>
    </div>
  );
}
