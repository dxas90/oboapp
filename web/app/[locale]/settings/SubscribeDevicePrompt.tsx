"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  getPlatformInfo,
  getNotificationInstructions,
  PlatformInfo,
} from "@/lib/platform-detection";
import { buttonStyles, buttonSizes } from "@/lib/theme";
import { borderRadius } from "@/lib/colors";

interface SubscribeDevicePromptProps {
  readonly onSubscribe: () => void;
  readonly hasAnySubscriptions: boolean;
}

export default function SubscribeDevicePrompt({
  onSubscribe,
  hasAnySubscriptions,
}: SubscribeDevicePromptProps) {
  const t = useTranslations("settings");
  const [platformInfo] = useState<PlatformInfo | null>(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      return getPlatformInfo();
    }
    return null;
  });

  // Don't show anything during SSR
  if (!platformInfo) {
    return null;
  }

  const instructions = getNotificationInstructions(platformInfo);

  return (
    <div className="mb-4 bg-warning-light border border-warning-border rounded-lg p-4">
      <p className="text-warning mb-2">
        {hasAnySubscriptions
          ? t("currentDeviceNotSubscribed")
          : t("noSubscriptionsPrompt")}
      </p>

      {platformInfo.requiresPWAInstall && (
        <div className="mb-3 p-3 bg-primary/10 border border-primary/20 rounded text-sm text-primary">
          <p className="font-semibold mb-2">📱 iOS Safari изисква инсталация</p>
          <p className="whitespace-pre-line">{instructions}</p>
        </div>
      )}

      {!platformInfo.supportsNotifications &&
        !platformInfo.requiresPWAInstall && (
          <div className="mb-3 p-3 bg-error-light border border-error-border rounded text-sm text-error">
            <p className="font-semibold mb-1">⚠️ Известията не са поддържани</p>
            <p>{instructions}</p>
          </div>
        )}

      {platformInfo.supportsNotifications && (
        <button
          type="button"
          onClick={onSubscribe}
          className={`${buttonSizes.md} ${buttonStyles.primary} ${borderRadius.md}`}
        >
          {t("subscribeThisDevice")}
        </button>
      )}
    </div>
  );
}
