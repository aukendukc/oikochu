'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc, GeoPoint, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import ConversationRecorder from './ConversationRecorder';
import ConversationEditor from './ConversationEditor';
import { Trash, Plus, Edit, MapPin, ChevronRight, Clock, UserCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Conversation {
  id: string;
  personId: string;
  transcript: string;
  summary: string;
  date: string;
  timestamp: number;
}

interface Location {
  latitude: number;
  longitude: number;
  description?: string;
  timestamp?: string;
}

interface HomelessPerson {
  id: string;
  nickname: string;
  ageGroup?: string;
  features?: string;
  category: string;
  lastSeen: string;
  locations: Location[];
  location?: {
    latitude: number;
    longitude: number;
  };
  conversations?: Array<{
    date: string;
    transcript: string;
    summary: string;
  }>;
  photoURL?: string;
}

interface PersonDetailsProps {
  personId: string;
  isPopup?: boolean;
}

export default function PersonDetails({ personId, isPopup = false }: PersonDetailsProps) {
  const [person, setPerson] = useState<HomelessPerson | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'conversations' | 'recorder' | 'edit'>('details');
  const [editedPerson, setEditedPerson] = useState<HomelessPerson | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 会話編集用の状態
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  
  const router = useRouter();
  
  useEffect(() => {
    const fetchPerson = async () => {
      try {
        console.log("PersonDetails: データ取得開始", personId);
        
        if (!personId) {
          console.error("PersonDetails: personIdが無効です");
          setError('無効なIDが指定されました');
          setLoading(false);
          return;
        }
        
        const personRef = doc(db, 'homelessPeople', personId);
        console.log("PersonDetails: personRefの作成", personRef);
        
        try {
          const personDoc = await getDoc(personRef);
          console.log("PersonDetails: personDocの取得完了", personDoc.exists());
          
          if (!personDoc.exists()) {
            console.error("PersonDetails: 該当する人物データが存在しません", personId);
            setError('指定された人物のデータが見つかりません');
            setLoading(false);
            return;
          }
          
          const personData = personDoc.data() as Omit<HomelessPerson, 'id'>;
          console.log("PersonDetails: 人物データ取得成功", personData);
          
          const processedPerson: HomelessPerson = {
            id: personId,
            ...personData,
            locations: personData.locations || 
              (personData.location ? [{ 
                latitude: personData.location.latitude, 
                longitude: personData.location.longitude,
                description: '元の位置',
                timestamp: new Date().toISOString()
              }] : [])
          };
          
          setPerson(processedPerson);
        } catch (docError) {
          console.error("人物データ取得エラー:", docError);
          setError(`人物データの取得中にエラーが発生しました: ${docError instanceof Error ? docError.message : '不明なエラー'}`);
          setLoading(false);
          return;
        }
        
        // Fetch conversations
        try {
          console.log("PersonDetails: 会話データの取得開始");
          const q = query(
            collection(db, 'conversations'),
            where('personId', '==', personId),
            orderBy('timestamp', 'desc')
          );
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const conversationsData: Conversation[] = [];
            snapshot.forEach((doc) => {
              conversationsData.push({
                id: doc.id,
                ...doc.data() as Omit<Conversation, 'id'>,
              });
            });
            console.log("PersonDetails: 会話データ取得", conversationsData.length);
            setConversations(conversationsData);
            setLoading(false);
          }, (error) => {
            console.error("会話データスナップショットエラー:", error);
            setError(`会話データの取得中にエラーが発生しました: ${error.message}`);
            setConversations([]);
            setLoading(false);
          });
          
          return () => unsubscribe();
        } catch (convError) {
          console.error("会話データの取得に失敗しました", convError);
          // 会話データの取得に失敗しても人物データは表示する
          setError(`会話データの取得中にエラーが発生しました: ${convError instanceof Error ? convError.message : '不明なエラー'}`);
          setConversations([]);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching person data:', error);
        setError(`データの取得中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
        setLoading(false);
      }
    };
    
    console.log("PersonDetails: コンポーネントマウント", { personId, isPopup });
    setLoading(true); // データ取得開始時に必ずローディング状態にする
    fetchPerson();
  }, [personId]);
  
  // 個人情報の編集の準備
  useEffect(() => {
    if (person) {
      setEditedPerson({...person});
    }
  }, [person]);
  
  // フォーム入力の更新ハンドラー
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (editedPerson) {
      setEditedPerson({
        ...editedPerson,
        [name]: value
      });
    }
  };
  
  // 位置情報の入力ハンドラー
  const handleLocationChange = (index: number, field: string, value: string) => {
    if (!editedPerson) return;
    
    const updatedLocations = [...editedPerson.locations];
    if (field === 'latitude' || field === 'longitude') {
      updatedLocations[index] = {
        ...updatedLocations[index],
        [field]: parseFloat(value) || 0
      };
    } else {
      updatedLocations[index] = {
        ...updatedLocations[index],
        [field]: value
      };
    }
    
    setEditedPerson({
      ...editedPerson,
      locations: updatedLocations
    });
  };
  
  // 新しい位置を追加
  const addNewLocation = () => {
    if (!editedPerson) return;
    
    const newLocation: Location = {
      latitude: 35.6895,  // 東京都の緯度（デフォルト値）
      longitude: 139.6917, // 東京都の経度（デフォルト値）
      description: '',
      timestamp: new Date().toISOString()
    };
    
    setEditedPerson({
      ...editedPerson,
      locations: [...editedPerson.locations, newLocation]
    });
  };
  
  // 位置を削除
  const removeLocation = (index: number) => {
    if (!editedPerson) return;
    
    // 少なくとも1つの位置情報は残す
    if (editedPerson.locations.length <= 1) {
      alert('少なくとも1つの位置情報が必要です');
      return;
    }
    
    const updatedLocations = [...editedPerson.locations];
    updatedLocations.splice(index, 1);
    
    setEditedPerson({
      ...editedPerson,
      locations: updatedLocations
    });
  };
  
  // 編集した情報を保存
  const handleSaveEdit = async () => {
    if (!editedPerson || !personId) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const personRef = doc(db, 'homelessPeople', personId);
      
      // Firebaseに送信するためのデータを準備（idフィールドを除く）
      const { id, location, ...dataToUpdate } = editedPerson;
      
      await updateDoc(personRef, dataToUpdate);
      
      // 更新成功を表示
      setSaveSuccess(true);
      
      // 元のデータも更新
      setPerson(editedPerson);
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating person:', error);
      setError('データの更新中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'yyyy年MM月dd日', { locale: ja });
    } catch {
      return dateStr;
    }
  };
  
  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      regular: '定期的に会う（赤）',
      occasional: 'たまに会う（黄）',
      new: '新規（緑）',
    };
    return categories[category] || category;
  };
  
  // 会話編集が完了した時の処理
  const handleConversationEditSuccess = () => {
    setEditingConversation(null);
  };
  
  // マップにリダイレクトする関数を追加
  const showLocationOnMap = (latitude: number, longitude: number) => {
    if (isPopup) {
      // ポップアップの場合は親のマップを更新するようイベントを発行
      window.dispatchEvent(new CustomEvent('show-location', { 
        detail: { latitude, longitude }
      }));
      
      // ポップアップを閉じる
      const closeButton = document.querySelector('[data-close-popup]') as HTMLButtonElement;
      if (closeButton) {
        closeButton.click();
      }
    } else {
      // 通常の場合はマップページにリダイレクト（クエリパラメータで位置情報を渡す）
      router.push(`/?lat=${latitude}&lng=${longitude}`);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm(`${person?.nickname}の情報を削除しますか？`)) {
      setIsSaving(true);
      try {
        await deleteDoc(doc(db, 'homelessPeople', personId));
        router.refresh();
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert('削除中にエラーが発生しました。');
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  const handlePersonDetails = () => {
    router.push(`/person/${personId}`);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">データを読み込み中...</span>
      </div>
    );
  }
  
  if (error || !person) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error || 'データが見つかりません'}</p>
        {!isPopup && (
          <button
            className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => router.push('/')}
          >
            マップに戻る
          </button>
        )}
      </div>
    );
  }
  
  // ポップアップモードではコンテナのスタイルを変更
  const containerClasses = isPopup 
    ? "w-full" 
    : "container mx-auto p-4 max-w-4xl";
  
  return (
    <div className={containerClasses}>
      {!isPopup && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-blue-500 dark:bg-gray-700 text-black dark:text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {person.photoURL ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                    <Image 
                      src={person.photoURL} 
                      alt={person.nickname} 
                      width={48} 
                      height={48}
                      className="object-cover w-full h-full" 
                    />
                  </div>
                ) : (
                  <UserCircle className="w-12 h-12 mr-3 text-white" />
                )}
                <h1 className="text-2xl font-bold">{person.nickname}</h1>
              </div>
              <button
                className="bg-white dark:bg-gray-600 text-blue-500 dark:text-white px-3 py-1 rounded hover:bg-blue-100 dark:hover:bg-gray-500"
                onClick={() => router.push('/')}
              >
                マップに戻る
              </button>
            </div>
          </div>
          
          <div className="border-b dark:border-gray-700">
            <nav className="flex">
              <button
                className={`px-4 py-2 border-r dark:border-gray-700 ${
                  activeTab === 'details' 
                    ? 'bg-blue-100 dark:bg-blue-900 font-bold text-blue-800 dark:text-blue-200' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('details')}
              >
                基本情報
              </button>
              <button
                className={`px-4 py-2 border-r dark:border-gray-700 ${
                  activeTab === 'conversations' 
                    ? 'bg-blue-100 dark:bg-blue-900 font-bold text-blue-800 dark:text-blue-200' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('conversations')}
              >
                会話履歴 ({conversations.length})
              </button>
              <button
                className={`px-4 py-2 border-r dark:border-gray-700 ${
                  activeTab === 'recorder' 
                    ? 'bg-blue-100 dark:bg-blue-900 font-bold text-blue-800 dark:text-blue-200' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('recorder')}
              >
                会話を記録
              </button>
              <button
                className={`px-4 py-2 ${
                  activeTab === 'edit' 
                    ? 'bg-blue-100 dark:bg-blue-900 font-bold text-blue-800 dark:text-blue-200' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('edit')}
              >
                編集
              </button>
            </nav>
          </div>
        </div>
      )}
      
      {isPopup && (
        <div className="border-b dark:border-gray-700 mb-4">
          <div className="flex items-center mb-2">
            {person.photoURL ? (
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                <Image 
                  src={person.photoURL} 
                  alt={person.nickname} 
                  width={40} 
                  height={40}
                  className="object-cover w-full h-full" 
                />
              </div>
            ) : (
              <UserCircle className="w-10 h-10 mr-3 text-gray-400" />
            )}
            <h1 className="text-2xl font-bold dark:text-white">{person.nickname}</h1>
          </div>
          <nav className="flex mb-2">
            <button
              className={`px-4 py-2 border-r dark:border-gray-700 ${
                activeTab === 'details' 
                  ? 'bg-blue-100 dark:bg-blue-900 font-bold text-blue-800 dark:text-blue-200' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('details')}
            >
              基本情報
            </button>
            <button
              className={`px-4 py-2 border-r dark:border-gray-700 ${
                activeTab === 'conversations' 
                  ? 'bg-blue-100 dark:bg-blue-900 font-bold text-blue-800 dark:text-blue-200' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('conversations')}
            >
              会話履歴 ({conversations.length})
            </button>
            <button
              className={`px-4 py-2 border-r dark:border-gray-700 ${
                activeTab === 'recorder' 
                  ? 'bg-blue-100 dark:bg-blue-900 font-bold text-blue-800 dark:text-blue-200' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('recorder')}
            >
              会話を記録
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 'edit' 
                  ? 'bg-blue-100 dark:bg-blue-900 font-bold text-blue-800 dark:text-blue-200' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('edit')}
            >
              編集
            </button>
          </nav>
        </div>
      )}
      
      <div className={isPopup ? "" : "p-4"}>
        {activeTab === 'details' && (
          <div className="space-y-4">
            <dl>
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-500 dark:text-gray-400">ニックネーム</dt>
                <dd className="mt-1 text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center">
                  {person.photoURL ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                      <Image 
                        src={person.photoURL} 
                        alt={person.nickname} 
                        width={32} 
                        height={32}
                        className="object-cover w-full h-full" 
                      />
                    </div>
                  ) : (
                    <UserCircle className="w-8 h-8 mr-2 text-gray-400" />
                  )}
                  {person.nickname}
                </dd>
              </div>
              <div className="bg-white dark:bg-gray-900 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-500 dark:text-gray-400">年齢層</dt>
                <dd className="mt-1 text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{person.ageGroup || '不明'}</dd>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-500 dark:text-gray-400">カテゴリ</dt>
                <dd className="mt-1 text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{getCategoryLabel(person.category)}</dd>
              </div>
              <div className="bg-white dark:bg-gray-900 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-500 dark:text-gray-400">最終確認日</dt>
                <dd className="mt-1 text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{person.lastSeen}</dd>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-gray-500 dark:text-gray-400">位置情報</dt>
                <dd className="mt-1 text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {person.locations && person.locations.length > 0 ? (
                    <div className="space-y-2">
                      {person.locations.map((loc, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-3 py-1">
                          <div className="font-medium">{loc.description || `位置 ${index + 1}`}</div>
                          <button 
                            onClick={() => showLocationOnMap(loc.latitude, loc.longitude)}
                            className="mt-1 flex items-center text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            <MapPin size={16} className="mr-1" />
                            マップで表示
                          </button>
                          {loc.timestamp && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              記録日: {formatDate(loc.timestamp.toString())}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">位置情報がありません</span>
                  )}
                </dd>
              </div>
              {person.features && (
                <div className="bg-white dark:bg-gray-900 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500 dark:text-gray-400">特徴</dt>
                  <dd className="mt-1 text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{person.features}</dd>
                </div>
              )}
              {person.photoURL && (
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500 dark:text-gray-400">プロフィール画像</dt>
                  <dd className="mt-1 text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                    <div className="w-40 h-40 rounded-lg overflow-hidden">
                      <Image 
                        src={person.photoURL} 
                        alt={person.nickname} 
                        width={160} 
                        height={160}
                        className="object-cover w-full h-full" 
                      />
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
        
        {activeTab === 'conversations' && (
          <div>
            {conversations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">会話履歴がありません</p>
            ) : (
              <ul className="space-y-4">
                {conversations.map((conversation) => (
                  <li key={conversation.id} className="border rounded-lg overflow-hidden dark:border-gray-700">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 font-medium flex justify-between items-center">
                      <span className="dark:text-white">{conversation.date}</span>
                      <button 
                        onClick={() => setEditingConversation(conversation)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center text-sm"
                      >
                        <Edit size={16} className="mr-1" />
                        編集
                      </button>
                    </div>
                    <div className="p-4 dark:bg-gray-900">
                      <h3 className="font-bold mb-2 dark:text-white">要約:</h3>
                      <div className="whitespace-pre-line mb-4 dark:text-gray-300">{conversation.summary}</div>
                      
                      <details className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <summary className="cursor-pointer dark:text-white">文字起こしを表示</summary>
                        <div className="p-2 mt-2 dark:text-gray-300">{conversation.transcript}</div>
                      </details>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {activeTab === 'recorder' && (
          <ConversationRecorder personId={personId} />
        )}
        
        {activeTab === 'edit' && editedPerson && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">情報を編集</h2>
            <form onSubmit={handleSaveEdit}>
              <div className="mb-4">
                <label className="block text-gray-900 dark:text-white text-sm font-bold mb-2" htmlFor="nickname">
                  ニックネーム
                </label>
                <input
                  id="nickname"
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={editedPerson.nickname}
                  onChange={(e) => setEditedPerson({...editedPerson, nickname: e.target.value})}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-900 dark:text-white text-sm font-bold mb-2" htmlFor="ageGroup">
                  年齢層
                </label>
                <select
                  id="ageGroup"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={editedPerson.ageGroup || ''}
                  onChange={(e) => setEditedPerson({...editedPerson, ageGroup: e.target.value})}
                >
                  <option value="">不明</option>
                  <option value="10代">10代</option>
                  <option value="20代">20代</option>
                  <option value="30代">30代</option>
                  <option value="40代">40代</option>
                  <option value="50代">50代</option>
                  <option value="60代">60代</option>
                  <option value="70代以上">70代以上</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-900 dark:text-white text-sm font-bold mb-2" htmlFor="category">
                  カテゴリ
                </label>
                <select
                  id="category"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={editedPerson.category}
                  onChange={(e) => setEditedPerson({...editedPerson, category: e.target.value})}
                >
                  <option value="new">新規（緑）</option>
                  <option value="occasional">たまに会う（黄）</option>
                  <option value="regular">定期的に会う（赤）</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-900 dark:text-white text-sm font-bold mb-2" htmlFor="features">
                  特徴
                </label>
                <textarea
                  id="features"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={editedPerson.features || ''}
                  onChange={(e) => setEditedPerson({...editedPerson, features: e.target.value})}
                  rows={3}
                />
              </div>
              
              {/* Display the current profile image if exists */}
              {person.photoURL && (
                <div className="mb-4">
                  <label className="block text-gray-900 dark:text-white text-sm font-bold mb-2">
                    現在のプロフィール画像
                  </label>
                  <div className="w-32 h-32 rounded-lg overflow-hidden">
                    <Image 
                      src={person.photoURL} 
                      alt={person.nickname} 
                      width={128} 
                      height={128}
                      className="object-cover w-full h-full" 
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    画像を変更するには、新しく登録し直す必要があります。
                  </p>
                </div>
              )}
              
              {saveSuccess && (
                <div className="mb-4 p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded">
                  保存しました
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={() => setActiveTab('details')}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 text-black dark:text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={isSaving}
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* 会話編集モーダル */}
      {editingConversation && (
        <ConversationEditor 
          conversation={editingConversation}
          onClose={() => setEditingConversation(null)}
          onSuccess={handleConversationEditSuccess}
        />
      )}
      
      <div className="flex justify-between mt-6">
        <button
          onClick={handleDelete}
          disabled={isSaving}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center disabled:opacity-50"
        >
          <Trash className="w-4 h-4 mr-1" />
          {isSaving ? '削除中...' : '削除'}
        </button>
        <button
          onClick={handlePersonDetails}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          詳細 <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}