# Component Migration Checklist

This document tracks which components have been migrated to use i18n and which still need work.

## ✅ Completed (Infrastructure)

- [x] i18n configuration setup (`web/i18n/`)
- [x] Translation files (`web/messages/*.json`)
- [x] Middleware for locale routing
- [x] App directory restructure (`[locale]/`)
- [x] Category label system (`useCategoryLabels` hook)
- [x] Core navigation helpers

## ✅ Migrated Components

- [x] `CategoryChips.tsx` - Uses `useCategoryLabels()`
- [x] `CategoryFilterBox.tsx` - Uses `useTranslations()` for UI text

## 🔄 Needs Migration

To find components with hardcoded text, run:

```bash
cd web
grep -r "Затвори\|Запази\|Настройки\|Изтрий\|Зареждане\|Публикувано" \
  app components --include="*.tsx" --include="*.ts"
```

### Priority Components

Based on grep results, these components likely need translation:

1. **Settings Page** (`app/[locale]/settings/`)
   - `page.tsx` - Main settings page
   - `DeleteAccountSection.tsx` - Delete account flow
   - `EmptyZonesMessage.tsx` - Empty state
   - `LoadingState.tsx` - Loading indicator
   - `SettingsHeader.tsx` - Page header
   - More setting components...

2. **Notifications** (`app/[locale]/notifications/page.tsx`)
   - Back button text
   - Status messages

3. **Message Components**
   - `MessageCard.tsx` - Date formatting, error messages
   - `MessageDetailView/` - Detail view components
   - `InterestTargetMode.tsx` - Save button
   - `InterestContextMenu.tsx` - Context menu items

4. **Onboarding** (`components/onboarding/`)
   - `GeolocationPrompt.tsx` - Geolocation prompts
   - `BlockedNotificationsPrompt.tsx` - Notification blocked message
   - `SubscribePrompt.tsx` - Subscribe CTA

5. **Other UI Components**
   - `UserMenu.tsx` - User menu items
   - Various helper hooks with error messages

### Migration Pattern

For each component:

1. **Add translations to `messages/*.json`**:

   ```json
   {
     "componentName": {
       "key": "Translation"
     }
   }
   ```

2. **Update component**:

   ```tsx
   import { useTranslations } from "next-intl";

   export default function MyComponent() {
     const t = useTranslations("componentName");

     return <div>{t("key")}</div>;
   }
   ```

3. **Test both locales**: Visit `/bg/...` and `/en/...`

## 🚀 Migration Strategy

### Phase 1: High-Traffic Pages

1. Home page (`page.tsx`)
2. Settings page
3. Message cards and detail views

### Phase 2: User Interactions

1. Buttons and CTAs
2. Form labels and placeholders
3. Error messages
4. Success messages

### Phase 3: Secondary Pages

1. Onboarding flows
2. About/Help pages (if any)
3. Admin/Debug pages

### Phase 4: Polish

1. Accessibility labels (`aria-label`, `aria-description`)
2. Page titles and meta descriptions
3. Error boundaries
4. Loading states

## Testing Checklist

After migrating each component:

- [ ] Check Bulgarian locale (`/bg/...`) displays correct text
- [ ] Check English locale (`/en/...`) displays correct text
- [ ] Verify no hardcoded strings remain
- [ ] Run tests: `npm run test:run`
- [ ] Check TypeScript: `npx tsc --noEmit`
- [ ] Test user flows (login, settings, notifications, etc.)

## Progress Tracking

Track your progress here:

```text
Total Components: TBD
Migrated: 2
Remaining: TBD
Progress: ~5%
```

Update this file as you complete migrations to keep track of remaining work.
