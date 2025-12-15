"use client";

import { useState } from "react";
import AuthButton from "./AuthButton";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  onOpenMessageModal: () => void;
}

export default function Header({ onOpenMessageModal }: HeaderProps) {
  const { user } = useAuth();
  const [logoError, setLogoError] = useState(false);

  return (
    <>
      {/* Top Header - Dark Blue */}
      <header className="bg-[#2c3e50] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header with Logo */}
          <div className="flex items-center justify-between py-3">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-4">
              {/* Logo - contained within header */}
              <div className="flex-shrink-0">
                {!logoError ? (
                  <img
                    src="/logo.png"
                    alt="СО Оборище"
                    className="h-12 w-auto object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="h-12 w-12 bg-white rounded flex items-center justify-center border-2 border-yellow-400">
                    <span className="text-[#2c3e50] font-bold text-xs text-center leading-tight">
                      СО
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold">Район Оборище</h1>
              </div>
            </div>

            {/* Right side - Auth Button */}
            <div>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar - Light Blue */}
      <nav className="bg-[#5DADE2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 py-3 items-center">
            <a
              href="/"
              className="text-white hover:text-gray-200 text-sm font-medium"
            >
              НАЧАЛО
            </a>
            {user && (
              <button
                onClick={onOpenMessageModal}
                className="text-white hover:text-gray-200 text-sm font-medium flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 4v16m8-8H4"></path>
                </svg>
                СЪОБЩЕНИЕ
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
