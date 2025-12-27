"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface MessageTextProps {
  readonly text: string;
  readonly markdownText?: string;
}

export default function MessageText({
  text,
  markdownText,
}: Readonly<MessageTextProps>) {
  // If no AI-formatted message, fall back to plain text with whitespace preservation
  if (!markdownText) {
    return (
      <p className="text-base text-gray-900 whitespace-pre-wrap">{text}</p>
    );
  }

  // Custom renderers for markdown elements with security and styling
  const components: Components = {
    // Headings rendered as styled divs to avoid semantic hierarchy issues
    h1: ({ children }) => (
      <div className="text-xl font-bold text-gray-900 mt-4 mb-2 first:mt-0">
        {children}
      </div>
    ),
    h2: ({ children }) => (
      <div className="text-lg font-bold text-gray-900 mt-3 mb-2 first:mt-0">
        {children}
      </div>
    ),
    h3: ({ children }) => (
      <div className="text-base font-bold text-gray-900 mt-2 mb-1 first:mt-0">
        {children}
      </div>
    ),
    h4: ({ children }) => (
      <div className="text-base font-semibold text-gray-900 mt-2 mb-1 first:mt-0">
        {children}
      </div>
    ),
    h5: ({ children }) => (
      <div className="text-sm font-semibold text-gray-900 mt-2 mb-1 first:mt-0">
        {children}
      </div>
    ),
    h6: ({ children }) => (
      <div className="text-sm font-semibold text-gray-700 mt-2 mb-1 first:mt-0">
        {children}
      </div>
    ),
    // Paragraphs
    p: ({ children }) => (
      <p className="text-base text-gray-900 mb-3 last:mb-0">{children}</p>
    ),
    // Lists
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-base text-gray-900">{children}</li>
    ),
    // Emphasis
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    // Line breaks
    br: () => <br />,
  };

  return (
    <div className="prose-message">
      <ReactMarkdown
        components={components}
        // Security: disable raw HTML to prevent XSS
        skipHtml={true}
        // Security: disallow external resources and potentially dangerous elements
        disallowedElements={[
          "img",
          "script",
          "iframe",
          "object",
          "embed",
          "style",
          "link",
          "video",
          "audio",
          "source",
        ]}
      >
        {markdownText}
      </ReactMarkdown>
    </div>
  );
}
