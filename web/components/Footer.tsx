"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="bg-footer-bg border-t border-neutral-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">
              {t("aboutProject")}
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <a
                  href="/kak-se-rodi"
                  className="text-link hover:text-link-hover hover:underline"
                >
                  {t("howItStarted")}
                </a>
              </div>
              <div>
                <Link
                  href="/sources"
                  className="text-link hover:text-link-hover hover:underline"
                >
                  {t("dataSources")}
                </Link>
              </div>
              <div>
                <Link
                  href="/ingest-errors"
                  className="text-link hover:text-link-hover hover:underline"
                >
                  {t("errorMessages")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-8 pt-6 border-t border-neutral-border text-center text-sm text-neutral">
          <p>
            <a
              href="https://github.com/vbuch/oboapp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover hover:underline"
              onClick={() => {
                trackEvent({
                  name: "external_link_clicked",
                  params: {
                    url: "https://github.com/vbuch/oboapp",
                    location: "footer",
                    link_text: t("openSource"),
                  },
                });
              }}
            >
              {t("openSource")}
            </a>
            {t("madeInOborishte")}
          </p>
        </div>
      </div>
    </footer>
  );
}
