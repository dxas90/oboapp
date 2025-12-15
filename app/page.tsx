"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import MapComponent from "@/components/MapComponent";
import { Message } from "@/lib/types";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapHeight, setMapHeight] = useState<number>(600);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate map height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        setMapHeight(height);
      }
    };

    updateHeight();
    globalThis.addEventListener("resize", updateHeight);

    return () => {
      globalThis.removeEventListener("resize", updateHeight);
    };
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/messages");

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError("Failed to load messages. Please refresh the page.");
      console.error("Error fetching messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    // Listen for message submission events
    const handleMessageSubmitted = () => {
      setTimeout(() => {
        fetchMessages();
      }, 2000);
    };

    globalThis.addEventListener("messageSubmitted", handleMessageSubmitted);

    return () => {
      globalThis.removeEventListener(
        "messageSubmitted",
        handleMessageSubmitted
      );
    };
  }, [fetchMessages]);

  return (
    <div className="flex-1 flex flex-col" ref={containerRef}>
      {/* Error message if any */}
      {error && (
        <div className="bg-white border-b shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Map - Takes all available space */}
      <div className="flex-1 relative" style={{ minHeight: `${mapHeight}px` }}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <p className="text-gray-600">Loading map...</p>
          </div>
        ) : (
          <MapComponent messages={messages} />
        )}
      </div>
    </div>
  );
}
