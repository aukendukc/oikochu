import PersonDetails from '@/components/PersonDetails';
import Navbar from '@/components/Navbar';
import ClientPersonPage from '@/components/ClientPersonPage';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';

// この関数は静的ページ生成時に実行される
export async function generateStaticParams() {
  // ダミーのIDリストを返します。実際のデプロイ時には動的に生成されるため使用されません
  return [{ id: 'placeholder' }];
}

export default function PersonPage({ params }: { params: { id: string } }) {
  return <ClientPersonPage id={params.id} />;
} 