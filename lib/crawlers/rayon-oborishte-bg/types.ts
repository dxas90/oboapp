export interface SourceDocument {
  url: string;
  datePublished: string; // ISO format
  title: string;
  message: string; // Markdown format
  sourceType: "rayon-oborishte-bg";
  crawledAt: Date;
}

export interface PostLink {
  url: string;
  title: string;
  date: string;
}
