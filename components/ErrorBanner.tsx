"use client";

type ErrorBannerProps = {
  message: string;
  onRetry: () => void;
};

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="mt-6 border-2 border-red-400 bg-red-50 rounded-lg p-6 text-center">
      <p className="text-red-700 font-medium">{message}</p>
      <button onClick={onRetry} className="mt-3 text-sm underline text-red-700">
        Try again
      </button>
    </div>
  );
}