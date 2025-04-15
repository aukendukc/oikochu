import PersonPageClient from './PersonPageClient';

interface PageProps {
  params: {
    id: string;
  };
}

// サーバーコンポーネントとしてのページ
export default async function PersonPage({ params }: PageProps) {
  return <PersonPageClient params={params} />;
} 