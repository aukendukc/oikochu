'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import PersonDetails from '@/components/PersonDetails';
import Navbar from '@/components/Navbar';

interface PageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function PersonPage({ params }: PageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  
  useEffect(() => {
    if (params.id) {
      console.log('Person page: ID from params:', params.id);
      setPersonId(params.id);
    } else {
      console.error('Person page: Missing ID in params');
      setError('IDが指定されていません');
    }
  }, [params.id]);
  
  useEffect(() => {
    if (!loading && !user) {
      console.log('Person page: No authenticated user, redirecting to home');
      router.push('/');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">認証情報を確認中...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect to home in useEffect
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <div className="container mx-auto p-4 flex-1">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">エラー</p>
            <p>{error}</p>
            <button
              className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => router.push('/')}
            >
              マップに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-1 pt-4">
        {personId ? (
          <PersonDetails personId={personId} />
        ) : (
          <div className="container mx-auto p-4">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p>IDが設定されていません。マップに戻ってください。</p>
              <button
                className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => router.push('/')}
              >
                マップに戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 