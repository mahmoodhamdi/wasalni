'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-white">
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-6xl font-bold text-rose-600">!</p>
          <p className="mt-4 text-lg text-gray-700">
            في مشكلة حصلت. حاول تاني بعد شوية.
            {error.digest ? <small className="block text-xs">[{error.digest}]</small> : null}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-md bg-rose-600 px-4 py-2 text-white hover:opacity-90"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
