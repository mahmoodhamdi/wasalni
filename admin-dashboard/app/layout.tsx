import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "وصّلني - لوحة التحكم",
  description: "لوحة تحكم إدارة تطبيق وصّلني للتوصيل",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            // Default options
            className: '',
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              fontSize: '14px',
              fontWeight: '500',
            },
            // Success toast styling
            success: {
              duration: 4000,
              iconTheme: {
                primary: '#10b981', // emerald-500
                secondary: '#fff',
              },
              style: {
                background: '#ecfdf5', // emerald-50
                color: '#065f46', // emerald-800
                border: '1px solid #10b981', // emerald-500
              },
            },
            // Error toast styling
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444', // red-500
                secondary: '#fff',
              },
              style: {
                background: '#fef2f2', // red-50
                color: '#991b1b', // red-800
                border: '1px solid #ef4444', // red-500
              },
            },
            // Loading toast styling
            loading: {
              iconTheme: {
                primary: '#10b981', // emerald-500
                secondary: '#fff',
              },
              style: {
                background: '#f0fdf4', // green-50
                color: '#166534', // green-800
                border: '1px solid #10b981', // emerald-500
              },
            },
          }}
        />
      </body>
    </html>
  );
}
