import "./globals.css";
import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ThemeProvider } from '@/lib/contexts/ThemeContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ホームレス支援アプリ",
  description: "ホームレスの人々の情報を管理し支援するためのアプリケーション",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} h-full dark:bg-gray-900 dark:text-white transition-colors duration-200`}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
