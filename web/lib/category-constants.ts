// Category enum - must match ingest/lib/categorize.schema.ts
export const CATEGORIES = [
  "air-quality",
  "art",
  "bicycles",
  "construction-and-repairs",
  "culture",
  "electricity",
  "health",
  "heating",
  "parking",
  "public-transport",
  "road-block",
  "sports",
  "traffic",
  "vehicles",
  "waste",
  "water",
  "weather",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Special frontend-only identifier for messages without categories
// This is NOT a real category - just a UI filtering concept
export const UNCATEGORIZED = "uncategorized" as const;

// Translation keys for categories (use with useTranslations("categories"))
// Example: t(`categories.${category}`)
export const CATEGORY_TRANSLATION_KEYS: Record<Category, string> = {
  "air-quality": "air-quality",
  art: "art",
  bicycles: "bicycles",
  "construction-and-repairs": "construction-and-repairs",
  culture: "culture",
  electricity: "electricity",
  health: "health",
  heating: "heating",
  parking: "parking",
  "public-transport": "public-transport",
  "road-block": "road-block",
  sports: "sports",
  traffic: "traffic",
  vehicles: "vehicles",
  waste: "waste",
  water: "water",
  weather: "weather",
};

// Translation key for uncategorized
export const UNCATEGORIZED_TRANSLATION_KEY = "uncategorized";

// Display order for real categories (most common first)
export const CATEGORY_DISPLAY_ORDER: Category[] = [
  "water",
  "electricity",
  "heating",
  "traffic",
  "construction-and-repairs",
  "road-block",
  "public-transport",
  "parking",
  "waste",
  "weather",
  "air-quality",
  "vehicles",
  "health",
  "culture",
  "art",
  "sports",
  "bicycles",
];
// Note: UNCATEGORIZED will be appended in the UI logic, not here
