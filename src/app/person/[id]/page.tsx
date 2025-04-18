// サーバーコンポーネントとしてのページ
import PersonPageClient from './PersonPageClient';

interface PageProps {
  params: {
    id: string;
  };
}

export default function PersonPage({ params }: PageProps) {
  return <PersonPageClient params={params} />;
} 