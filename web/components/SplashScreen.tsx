"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function SplashScreen() {
  const [logoError, setLogoError] = useState(false);
  const t = useTranslations("common");

  return (
    <div className="flex-1 flex items-center justify-center bg-header-bg">
      <div className="flex flex-col items-center gap-4">
        {!logoError && (
          <div className="animate-pulse">
            <Image
              src="/logo.png"
              alt="OboApp"
              width={120}
              height={120}
              onError={() => setLogoError(true)}
              priority
            />
          </div>
        )}
        <p className="text-white text-lg">{t("loading")}</p>
      </div>
    </div>
  );
}
