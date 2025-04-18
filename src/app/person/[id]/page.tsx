// サーバーコンポーネントとしてのページ
import ClientPersonPage from '@/components/ClientPersonPage';

interface PageProps {
  params: {
    id: string;
  };
}

export default function PersonPage({ params }: PageProps) {
  return <ClientPersonPage id={params.id} />;
} 