'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import MapView from '@/components/MapView';
import SignInWithGoogle from '@/components/SignInWithGoogle';
import Navbar from '@/components/Navbar';

export default function Home() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {user ? (
        <>
          <Navbar />
          <div className="flex-1">
            <MapView />
          </div>
        </>
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h1 className="text-2xl font-bold text-center mb-6 text-blue-700">OIKOS Support Map</h1>
            <p className="text-gray-600 mb-6 text-center">
              新宿駅周辺の路上生活者支援活動の効率化と情報管理のためのアプリケーションです。
            </p>
            <div className="bg-blue-100 p-4 rounded-lg mb-6">
              <h2 className="font-bold text-blue-800 mb-2">主な機能</h2>
              <ul className="list-disc pl-5 text-blue-800">
                <li>路上生活者の居場所のマッピング</li>
                <li>個人情報と対話内容の記録・管理</li>
                <li>音声記録と自動要約による効率的な情報収集</li>
              </ul>
            </div>
            <div className="text-center">
              <SignInWithGoogle />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
