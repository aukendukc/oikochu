'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Search, Filter } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';

interface HomelessPerson {
  id: string;
  nickname: string;
  ageGroup?: string;
  features?: string;
  category: string;
  lastSeen: string;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<HomelessPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'homelessPeople'), orderBy('nickname'));
        const querySnapshot = await getDocs(q);
        
        const fetchedPeople: HomelessPerson[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPeople.push({
            id: doc.id,
            ...doc.data() as Omit<HomelessPerson, 'id'>
          });
        });
        
        setPeople(fetchedPeople);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'new':
        return 'bg-green-500 dark:bg-green-600';
      case 'occasional':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'regular':
        return 'bg-red-500 dark:bg-red-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'new':
        return '新規';
      case 'occasional':
        return 'たまに会う';
      case 'regular':
        return '定期的に会う';
      default:
        return category;
    }
  };

  const filteredPeople = people.filter(person => {
    // 検索とフィルターの両方に一致するかどうか
    const matchesSearch = searchTerm === '' || 
      person.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.features && person.features.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterCategory === '' || person.category === filterCategory;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">登録者一覧</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="名前または特徴を検索"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">全カテゴリ</option>
                <option value="new">新規</option>
                <option value="occasional">たまに会う</option>
                <option value="regular">定期的に会う</option>
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.length > 0 ? (
              filteredPeople.map(person => (
                <div 
                  key={person.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden cursor-pointer transition-transform hover:transform hover:scale-105"
                  onClick={() => router.push(`/person/${person.id}`)}
                >
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <span className={`w-3 h-3 rounded-full mr-2 ${getCategoryColor(person.category)}`}></span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{person.nickname}</h3>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p>
                        <span className="font-medium">カテゴリ:</span> {getCategoryText(person.category)}
                      </p>
                      {person.ageGroup && (
                        <p>
                          <span className="font-medium">年齢層:</span> {person.ageGroup}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">最終確認:</span> {person.lastSeen}
                      </p>
                    </div>
                    
                    {person.features && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-gray-600 dark:text-gray-300">特徴:</span>
                        <p className="text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">{person.features}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                該当する登録者が見つかりません
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 