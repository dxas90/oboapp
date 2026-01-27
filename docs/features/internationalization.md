# Internationalization (i18n) Guide

## Overview

The web application uses `next-intl` for internationalization. Currently supported locales:

- `bg` (Bulgarian) - default
- `en` (English)

All URLs are prefixed with locale (e.g., `/bg/settings`, `/en/settings`).

## Architecture

### File Structure

```text
web/
├── i18n/
│   ├── request.ts         # Locale configuration
│   └── routing.ts         # Routing and navigation helpers
├── messages/
│   ├── bg.json            # Bulgarian translations
│   └── en.json            # English translations
├── middleware.ts          # Locale detection and routing
└── app/
    ├── [locale]/          # Localized pages
    │   ├── layout.tsx     # Provides NextIntlClientProvider
    │   └── page.tsx       # Home page
    └── layout.tsx         # Root layout (minimal)
```

### Translation Files

Translation files (`messages/*.json`) are organized by namespaces:

- `common` - Common UI elements (buttons, labels)
- `categories` - Category labels
- `settings` - Settings page strings
- `notifications` - Notification-related strings
- `messages` - Message card and detail view strings
- `aria` - Accessibility labels

## Usage

### In Client Components

```tsx
"use client";

import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations("common");

  return <button>{t("save")}</button>;
}
```

### In Server Components

```tsx
import { useTranslations } from "next-intl";

export default async function MyServerComponent() {
  const t = await useTranslations("common");

  return <h1>{t("settings")}</h1>;
}
```

### Multiple Namespaces

```tsx
const t = useTranslations("common");
const tSettings = useTranslations("settings");

return (
  <div>
    <button>{t("save")}</button>
    <h1>{tSettings("title")}</h1>
  </div>
);
```

### Category Labels (Special Pattern)

Categories use a custom hook for consistency:

```tsx
import { useCategoryLabels } from "@/lib/hooks/useCategoryLabels";

function MyComponent() {
  const { getCategoryLabel, categoriesLabel } = useCategoryLabels();

  return (
    <div>
      <h2>{categoriesLabel}</h2>
      <span>{getCategoryLabel("water")}</span>
      <span>{getCategoryLabel(UNCATEGORIZED)}</span>
    </div>
  );
}
```

### Navigation with Locale Awareness

```tsx
import { Link, useRouter, usePathname } from "@/i18n/routing";

// Link component (automatically includes locale)
<Link href="/settings">Settings</Link>

// Programmatic navigation
const router = useRouter();
router.push("/settings");  // Navigates to /bg/settings or /en/settings

// Get current pathname without locale
const pathname = usePathname();  // "/settings" instead of "/bg/settings"
```

## Adding New Translations

### 1. Add to Translation Files

Update both `messages/bg.json` and `messages/en.json`:

```json
{
  "myFeature": {
    "title": "My Title",
    "description": "My Description"
  }
}
```

### 2. Use in Components

```tsx
const t = useTranslations("myFeature");

<h1>{t("title")}</h1>
<p>{t("description")}</p>
```

## Adding a New Locale

### 1. Update Configuration

Edit `web/i18n/request.ts`:

```ts
export const locales = ["bg", "en", "de"] as const;  // Add "de"
```

### 2. Create Translation File

Create `web/messages/de.json` with all required translations.

### 3. Deploy

Translation files are bundled at build time. Redeploy the app after adding locales.

## Migration Guide

### Converting Hardcoded Strings

**Before:**

```tsx
<button>Запази</button>
```

**After:**

```tsx
const t = useTranslations("common");
<button>{t("save")}</button>
```

### Converting Category Labels

**Before:**

```tsx
import { CATEGORY_LABELS } from "@/lib/category-constants";
<span>{CATEGORY_LABELS[category]}</span>
```

**After:**

```tsx
import { useCategoryLabels } from "@/lib/hooks/useCategoryLabels";
const { getCategoryLabel } = useCategoryLabels();
<span>{getCategoryLabel(category)}</span>
```

## Testing

Translations are type-checked at build time. Missing keys will cause TypeScript errors.

To test a specific locale:

1. Navigate to `/bg` or `/en`
2. The locale persists across navigation
3. Use browser DevTools to verify correct text rendering

## Accessibility

All `aria-label` and `aria-description` attributes should use translations:

```tsx
const t = useTranslations("aria");
<button aria-label={t("closeMenu")}>X</button>
```

## Performance

- Translation files are bundled at build time (no runtime fetching)
- Only the active locale's messages are loaded
- Changing locales requires a page navigation (not supported client-side mid-session)

## Best Practices

1. **Never hardcode user-facing text** - Always use translation keys
2. **Organize by feature** - Use logical namespaces in translation files
3. **Keep keys descriptive** - Use `deleteAccount.title` not `da1`
4. **Reuse common strings** - Check `common` namespace before adding duplicates
5. **Test both locales** - Always verify translations before deploying
6. **Update both files** - Never add a key to only one language file
