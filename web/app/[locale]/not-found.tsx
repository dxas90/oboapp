import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Страницата не е намерена - OboApp",
  description: "Страницата, която търсите, не съществува.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Страницата не е намерена
          </h2>
          <p className="text-gray-600 mb-8">
            Страницата, която търсите, не съществува или е била преместена.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Начало
          </Link>
        </div>
      </div>
    </div>
  );
}
