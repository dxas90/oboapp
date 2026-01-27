"use client";

import { useTranslations } from "next-intl";
import PromptCard from "../PromptCard";
import NoNotificationsIcon from "@/components/icons/NoNotificationsIcon";

/**
 * Shown when browser/OS has notifications disabled (issue #32).
 * This is a final state with no actions - users must enable notifications
 * in browser settings to proceed.
 */
export default function BlockedNotificationsPrompt() {
  const t = useTranslations("onboarding.blockedNotifications");
  return (
    <div className="animate-fade-in absolute bottom-4 right-4 z-40 max-w-sm">
      <PromptCard
        icon={<NoNotificationsIcon className="w-12 h-12 text-warning" />}
        title={t("title")}
        description={t("description")}
      />
    </div>
  );
}
