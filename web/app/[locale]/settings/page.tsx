"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Interest, NotificationSubscription } from "@/lib/types";
import {
  subscribeToPushNotifications,
  requestNotificationPermission,
  markExplicitUnsubscribe,
  getNotificationPermission,
} from "@/lib/notification-service";
import { getMessaging, getToken } from "firebase/messaging";
import { app } from "@/lib/firebase";
import NotificationsSection from "./NotificationsSection";
import NotificationHistorySection from "./NotificationHistorySection";
import ZonesSection from "./ZonesSection";
import DeleteAccountSection from "./DeleteAccountSection";
import DeleteSuccessMessage from "./DeleteSuccessMessage";
import LoadingState from "./LoadingState";
import SettingsHeader from "./SettingsHeader";
import ErrorBanner from "./ErrorBanner";

export default function SettingsPage() {
  const { user, signOut, reauthenticateWithGoogle } = useAuth();
  const router = useRouter();
  const t = useTranslations("settings");

  const [interests, setInterests] = useState<Interest[]>([]);
  const [subscriptions, setSubscriptions] = useState<
    NotificationSubscription[]
  >([]);
  const [currentDeviceToken, setCurrentDeviceToken] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState<number>(0);

  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const token = await user.getIdToken();
      const authHeader = `Bearer ${token}`;

      // Fetch interests and subscriptions in parallel
      const [interestsRes, subscriptionsRes, countRes] = await Promise.all([
        fetch("/api/interests", {
          headers: { Authorization: authHeader },
        }),
        fetch("/api/notifications/subscription/all", {
          headers: { Authorization: authHeader },
        }),
        fetch("/api/notifications/history/count", {
          headers: { Authorization: authHeader },
        }),
      ]);

      if (!interestsRes.ok || !subscriptionsRes.ok || !countRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [interestsData, subscriptionsData, countData] = await Promise.all([
        interestsRes.json(),
        subscriptionsRes.json(),
        countRes.json(),
      ]);

      setInterests(
        Array.isArray(interestsData?.interests) ? interestsData.interests : []
      );
      setSubscriptions(
        Array.isArray(subscriptionsData) ? subscriptionsData : []
      );
      setNotificationCount(
        typeof countData?.count === "number" ? countData.count : 0
      );
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(t("loadError"));
      // Ensure arrays are set even on error
      setInterests([]);
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch data
  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    fetchData();
  }, [user, router, fetchData]);

  // Get current device FCM token
  useEffect(() => {
    const getCurrentToken = async () => {
      try {
        // Check if Firebase Messaging is supported
        const { isMessagingSupported } = await import(
          "@/lib/notification-service"
        );
        const supported = await isMessagingSupported();

        if (!supported) {
          console.warn(
            "Firebase Messaging is not supported on this browser/platform"
          );
          return;
        }

        const messaging = getMessaging(app);
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) return;

        const token = await getToken(messaging, { vapidKey });
        if (token) {
          setCurrentDeviceToken(token);
        }
      } catch (error) {
        console.error("Error getting current device token:", error);
      }
    };

    if (globalThis.window !== undefined) {
      getCurrentToken();
    }
  }, []);

  const handleSubscribeCurrentDevice = async () => {
    if (!user) return;

    try {
      // Check if Firebase Messaging is supported first
      const { isMessagingSupported } = await import(
        "@/lib/notification-service"
      );
      const supported = await isMessagingSupported();

      if (!supported) {
        alert(t("notificationsNotSupported"));
        return;
      }

      // Check if notifications are blocked
      const currentPermission = getNotificationPermission();
      if (currentPermission === "denied") {
        alert(t("notificationsBlocked"));
        return;
      }

      const granted = await requestNotificationPermission();
      if (!granted) {
        alert(t("pleaseAllowNotifications"));
        return;
      }

      const token = await user.getIdToken();
      await subscribeToPushNotifications(user.uid, token);
      await fetchData(); // Refresh subscriptions
    } catch (error) {
      console.error("Error subscribing:", error);
      alert(t("subscribeError"));
    }
  };

  const handleUnsubscribeDevice = async (deviceToken: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `/api/notifications/subscription?token=${encodeURIComponent(
          deviceToken
        )}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unsubscribe");
      }

      // Mark that user explicitly unsubscribed
      markExplicitUnsubscribe(user.uid);

      await fetchData(); // Refresh subscriptions
    } catch (error) {
      console.error("Error unsubscribing:", error);
      alert(t("unsubscribeError"));
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!user) return;
    if (!confirm(t("unsubscribeAllConfirm"))) {
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/notifications/subscription/all", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to unsubscribe all");
      }

      // Mark that user explicitly unsubscribed
      markExplicitUnsubscribe(user.uid);

      await fetchData(); // Refresh subscriptions
    } catch (error) {
      console.error("Error unsubscribing all:", error);
      alert(t("unsubscribeAllError"));
    }
  };

  const handleDeleteAccount = async (confirmText: string) => {
    if (confirmText !== t("deleteAccount.confirmationText")) {
      alert(t("deleteAccount.confirmationError"));
      return;
    }

    setIsDeleting(true);

    try {
      // Step 1: Re-authenticate user for security
      try {
        await reauthenticateWithGoogle();
      } catch (reauthError) {
        console.error("Re-authentication failed:", reauthError);
        alert(t("reauthRequired"));
        setIsDeleting(false);
        return;
      }

      // Step 2: Delete all user data from backend
      const token = await user!.getIdToken();
      const response = await fetch("/api/user", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      setDeleteSuccess(true);

      // Sign out after 2 seconds
      setTimeout(async () => {
        await signOut();
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(t("deleteAccountError"));
      setIsDeleting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (deleteSuccess) {
    return <DeleteSuccessMessage />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SettingsHeader />

        {error && <ErrorBanner message={error} />}

        <NotificationHistorySection count={notificationCount} />

        <NotificationsSection
          subscriptions={subscriptions}
          currentDeviceToken={currentDeviceToken}
          onSubscribeCurrentDevice={handleSubscribeCurrentDevice}
          onUnsubscribeDevice={handleUnsubscribeDevice}
          onUnsubscribeAll={handleUnsubscribeAll}
        />

        <ZonesSection interests={interests} />

        <DeleteAccountSection
          onDeleteAccount={handleDeleteAccount}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
