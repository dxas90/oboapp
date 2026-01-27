import type { Metadata } from "next";
import Script from "next/script";
import { Sofia_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import ClientLayout from "@/components/ClientLayout";
import { locales } from "@/i18n/request";

const sofiaSans = Sofia_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sofia-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OboApp",
  description: "Следи събитията в район Оборище",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://oboapp.online",
  ),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OboApp",
  },
  openGraph: {
    title: "OboApp",
    description: "Следи събитията в район Оборище",
    images: ["/icon-512x512.png"],
    locale: "bg_BG",
    type: "website",
    siteName: "OboApp",
  },
  twitter: {
    card: "summary",
    title: "OboApp",
    description: "Следи събитията в район Оборище",
    images: ["/icon-512x512.png"],
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang={locale}>
      <body className={`${sofiaSans.variable} font-sofia`}>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                // Wait for consent before initializing
                gtag('consent', 'default', {
                  'analytics_storage': 'denied'
                });

                // Check for stored consent and initialize if granted
                if (typeof window !== 'undefined') {
                  const consent = localStorage.getItem('ga_consent');
                  if (consent === 'granted') {
                    gtag('consent', 'update', {
                      'analytics_storage': 'granted'
                    });
                    gtag('config', '${gaId}', {
                      page_path: window.location.pathname,
                    });
                  }
                }
              `}
            </Script>
          </>
        )}
        <NextIntlClientProvider messages={messages}>
          <ClientLayout>{children}</ClientLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
