"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import PromptCard from "../PromptCard";
import { useAuth } from "@/lib/auth-context";
import BellIcon from "@/components/icons/BellIcon";

interface LoginPromptProps {
  /** Called when user clicks "Later" */
  readonly onDismiss: () => void;
}

/**
 * Prompt for unauthenticated users to log in
 * Fully controlled by parent via onDismiss prop
 */
export default function LoginPrompt({ onDismiss }: LoginPromptProps) {
  const { signInWithGoogle } = useAuth();
  const t = useTranslations("onboarding.loginPrompt");

  const handleLogin = useCallback(() => {
    trackEvent({ name: "login_initiated", params: { source: "prompt" } });
    signInWithGoogle();
  }, [signInWithGoogle]);

  const handleClose = useCallback(() => {
    trackEvent({ name: "login_prompt_dismissed", params: {} });
    onDismiss();
  }, [onDismiss]);

  return (
    <div className="animate-fade-in absolute bottom-4 right-4 z-40 max-w-sm">
      <PromptCard
        icon={<BellIcon className="w-12 h-12 text-primary" />}
        title={t("title")}
        description={t("description")}
        primaryButton={{
          text: t("loginWithGoogle"),
          onClick: handleLogin,
        }}
        secondaryButton={{
          text: t("later"),
          onClick: handleClose,
        }}
      />
    </div>
  );
}
