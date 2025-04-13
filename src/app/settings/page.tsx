'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/lib/contexts/ThemeContext';
import Navbar from '@/components/Navbar';

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect to home in useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar />
      
      <div className="container mx-auto p-4 flex-1">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">設定</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">ユーザー設定</h2>
          </div>
          
          <div className="p-4">
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2 text-gray-900 dark:text-white">アカウント情報</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <p className="dark:text-white"><span className="font-medium">名前:</span> {user.displayName || '未設定'}</p>
                <p className="dark:text-white"><span className="font-medium">メール:</span> {user.email}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2 text-gray-900 dark:text-white">アプリケーション設定</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoSave"
                    className="mr-2"
                    defaultChecked={true}
                  />
                  <label htmlFor="autoSave" className="text-gray-900 dark:text-white">会話録音後に自動で保存する</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="darkMode"
                    className="mr-2"
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                  />
                  <label htmlFor="darkMode" className="text-gray-900 dark:text-white">ダークモード</label>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2 text-gray-900 dark:text-white">デバイス設定</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                このアプリケーションはマイクへのアクセス許可が必要です。ブラウザの設定でマイクへのアクセスを許可してください。
              </p>
              <button
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded"
                onClick={() => {
                  navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(() => alert('マイクへのアクセスが許可されています'))
                    .catch(() => alert('マイクへのアクセスが許可されていません'));
                }}
              >
                マイク設定を確認
              </button>
            </div>
            
            <div className="border-t dark:border-gray-700 pt-4 mt-4">
              <button
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded"
                onClick={() => setShowConfirmation(true)}
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ログアウトの確認</h2>
            <p className="mb-4 text-gray-800 dark:text-gray-200">ログアウトしますか？</p>
            <div className="flex justify-end">
              <button
                className="mr-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded"
                onClick={() => setShowConfirmation(false)}
              >
                キャンセル
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-black dark:text-white font-bold py-2 px-4 rounded"
                onClick={handleSignOut}
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 