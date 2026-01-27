import type { ReactNode } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // This root layout only exists to pass through to [locale]/layout.tsx
  // The actual layout logic (fonts, scripts, providers) is in [locale]/layout.tsx
  return children;
}
