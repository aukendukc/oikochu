'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { User, List, Map, Settings, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="bg-blue-500 dark:bg-gray-800 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="font-bold text-xl">
                ホームレス支援
              </Link>
            </div>
          </div>
          
          {!loading && user && (
            <div className="hidden md:flex items-center space-x-1">
              <Link 
                href="/" 
                className="py-2 px-3 hover:bg-blue-600 dark:hover:bg-gray-700 rounded flex items-center"
              >
                <Map size={18} className="mr-1" />
                マップ
              </Link>
              <Link 
                href="/people" 
                className="py-2 px-3 hover:bg-blue-600 dark:hover:bg-gray-700 rounded flex items-center"
              >
                <List size={18} className="mr-1" />
                リスト
              </Link>
              <Link 
                href="/settings" 
                className="py-2 px-3 hover:bg-blue-600 dark:hover:bg-gray-700 rounded flex items-center"
              >
                <Settings size={18} className="mr-1" />
                設定
              </Link>
              <button 
                onClick={handleSignOut}
                className="py-2 px-3 hover:bg-blue-600 dark:hover:bg-gray-700 rounded flex items-center"
              >
                <LogOut size={18} className="mr-1" />
                ログアウト
              </button>
            </div>
          )}
          
          {/* モバイルメニューボタン */}
          {!loading && user && (
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-600 dark:hover:bg-gray-700 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* モバイルメニュー */}
      {isMenuOpen && !loading && user && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-blue-500 dark:bg-gray-800">
            <Link
              href="/"
              className="block px-3 py-2 rounded text-white hover:bg-blue-600 dark:hover:bg-gray-700 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <Map size={18} className="mr-2" />
              マップ
            </Link>
            <Link
              href="/people"
              className="block px-3 py-2 rounded text-white hover:bg-blue-600 dark:hover:bg-gray-700 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <List size={18} className="mr-2" />
              リスト
            </Link>
            <Link
              href="/settings"
              className="block px-3 py-2 rounded text-white hover:bg-blue-600 dark:hover:bg-gray-700 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings size={18} className="mr-2" />
              設定
            </Link>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleSignOut();
              }}
              className="block w-full text-left px-3 py-2 rounded text-white hover:bg-blue-600 dark:hover:bg-gray-700 flex items-center"
            >
              <LogOut size={18} className="mr-2" />
              ログアウト
            </button>
          </div>
        </div>
      )}
    </nav>
  );
} 