// サーバーコンポーネントとしてのページ
import ClientPersonPage from '@/components/ClientPersonPage';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface PageProps {
  params: {
    id: string;
  };
}

// 静的に生成するパラメータを指定
export async function generateStaticParams() {
  try {
    // 本番環境のビルド時には実際のデータを取得できないため、ダミーIDを返す
    if (process.env.NODE_ENV === 'production') {
      return [
        { id: 'placeholder' },
      ];
    }
    
    // 開発環境ではFirestoreからデータを取得
    const snapshot = await getDocs(collection(db, 'homelessPeople'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // エラー時もダミーデータを返す
    return [
      { id: 'placeholder' },
    ];
  }
}

export default function PersonPage({ params }: PageProps) {
  return <ClientPersonPage id={params.id} />;
} 