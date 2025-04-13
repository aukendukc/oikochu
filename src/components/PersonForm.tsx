'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, GeoPoint, updateDoc, doc, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { uploadFile } from '@/lib/firebase/firebaseUtils';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { auth } from '@/lib/firebase/firebase';

interface PersonFormProps {
  location: { lat: number; lng: number };
  onClose: () => void;
  onSuccess: () => void;
}

interface HomelessPerson {
  id: string;
  nickname: string;
  ageGroup?: string;
  category: string;
  features?: string;
  locations?: Array<{latitude: number; longitude: number; description?: string; timestamp?: string}>;
  location?: GeoPoint;
  photoURL?: string;
}

export default function PersonForm({ location, onClose, onSuccess }: PersonFormProps) {
  // 新規登録用の状態
  const [nickname, setNickname] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [category, setCategory] = useState('new');
  const [features, setFeatures] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // 既存の人に場所を追加するための状態
  const [formMode, setFormMode] = useState<'new' | 'existing'>('new');
  const [existingPeople, setExistingPeople] = useState<HomelessPerson[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [filteredPeople, setFilteredPeople] = useState<HomelessPerson[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // 既存の人を取得
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const q = query(collection(db, 'homelessPeople'));
        const querySnapshot = await getDocs(q);
        const people: HomelessPerson[] = [];
        
        querySnapshot.forEach((doc) => {
          people.push({
            id: doc.id,
            ...doc.data() as Omit<HomelessPerson, 'id'>
          });
        });
        
        setExistingPeople(people);
        setFilteredPeople(people);
      } catch (error) {
        console.error('Error fetching people:', error);
      }
    };
    
    fetchPeople();
  }, []);
  
  // 検索フィルタリング
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPeople(existingPeople);
    } else {
      const filtered = existingPeople.filter(person => 
        person.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (person.features && person.features.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPeople(filtered);
    }
  }, [searchTerm, existingPeople]);
  
  // 新規登録フォームの送信
  const handleNewPersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      alert('ニックネームを入力してください');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let photoURL = '';
      
      // 画像がアップロードされた場合は、Firebase Storageに保存
      if (imageFile) {
        try {
          // ユーザーが認証されているか確認
          if (!auth.currentUser) {
            throw new Error('画像をアップロードするにはログインが必要です');
          }
          
          console.log('画像アップロード開始:', imageFile.name);
          
          // ユニークなファイル名を生成
          const fileExtension = imageFile.name.split('.').pop();
          const filePath = `profile-images/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
          
          console.log('アップロードパス:', filePath);
          
          // Firebase Storageに画像をアップロード
          photoURL = await uploadFile(imageFile, filePath);
          console.log('画像のアップロードに成功しました:', photoURL);
        } catch (uploadError) {
          console.error('画像のアップロードに失敗しました:', uploadError);
          alert(`画像のアップロードに失敗しました: ${uploadError instanceof Error ? uploadError.message : '不明なエラー'}`);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Firestoreに新しい人物を追加
      console.log('Firestoreにデータを追加中...');
      await addDoc(collection(db, 'homelessPeople'), {
        nickname,
        ageGroup: ageGroup || '不明',
        category,
        features,
        photoURL,
        locations: [{
          latitude: location.lat,
          longitude: location.lng,
          description: '',
          timestamp: new Date().toISOString()
        }],
        lastSeen: format(new Date(), 'yyyy/MM/dd HH:mm'),
        createdAt: new Date().toISOString(),
      });
      
      console.log('データの追加が完了しました');
      onSuccess();
    } catch (error) {
      console.error('Error adding person:', error);
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 既存の人に新しい場所を追加
  const handleAddLocationToExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPersonId) {
      alert('人を選択してください');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const personRef = doc(db, 'homelessPeople', selectedPersonId);
      const selectedPerson = existingPeople.find(p => p.id === selectedPersonId);
      
      if (!selectedPerson) {
        throw new Error('選択された人が見つかりません');
      }
      
      // 既存のlocationsフィールドを取得し、新しい場所を追加
      let locations = selectedPerson.locations || [];
      
      // 古いデータ形式からの変換（location -> locations）
      if (!locations.length && selectedPerson.location) {
        locations = [{
          latitude: selectedPerson.location.latitude,
          longitude: selectedPerson.location.longitude,
          description: '元の位置',
          timestamp: new Date().toISOString()
        }];
      }
      
      // 新しい場所を追加
      locations.push({
        latitude: location.lat,
        longitude: location.lng,
        description: locationDescription,
        timestamp: new Date().toISOString()
      });
      
      // Firebaseを更新
      await updateDoc(personRef, {
        locations,
        lastSeen: format(new Date(), 'yyyy/MM/dd HH:mm'),
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error updating person:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 画像変更ハンドラー
  const handleImageChange = (file: File | null) => {
    setImageFile(file);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="mb-4">
          <div className="flex border-b dark:border-gray-700">
            <button
              className={`py-2 px-4 text-gray-800 dark:text-gray-200 ${formMode === 'new' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
              onClick={() => setFormMode('new')}
            >
              新規登録
            </button>
            <button
              className={`py-2 px-4 text-gray-800 dark:text-gray-200 ${formMode === 'existing' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
              onClick={() => setFormMode('existing')}
            >
              既存登録者に追加
            </button>
          </div>
        </div>
        
        {formMode === 'new' ? (
          <form onSubmit={handleNewPersonSubmit}>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">新規登録</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="nickname">
                ニックネーム *
              </label>
              <input
                id="nickname"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="ageGroup">
                年齢層
              </label>
              <select
                id="ageGroup"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
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
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="category">
                カテゴリ
              </label>
              <select
                id="category"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="new">新規（緑）</option>
                <option value="occasional">たまに会う（黄）</option>
                <option value="regular">定期的に会う（赤）</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="features">
                特徴
              </label>
              <textarea
                id="features"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                プロフィール画像
              </label>
              <ImageUpload onImageChange={handleImageChange} />
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                位置情報：緯度 {location.lat.toFixed(6)}, 経度 {location.lng.toFixed(6)}
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded focus:shadow-outline mr-2"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 text-white font-bold py-2 px-4 rounded focus:shadow-outline"
              >
                {isSubmitting ? '登録中...' : '登録'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddLocationToExisting}>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">既存の人に場所を追加</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                登録者を検索
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full pl-10 py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="名前や特徴で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                登録者を選択 *
              </label>
              <div className="bg-gray-100 dark:bg-gray-700 rounded max-h-40 overflow-y-auto p-2">
                {filteredPeople.length > 0 ? (
                  filteredPeople.map(person => (
                    <div 
                      key={person.id} 
                      className={`p-2 mb-1 rounded cursor-pointer ${
                        selectedPersonId === person.id 
                          ? 'bg-blue-100 dark:bg-blue-900' 
                          : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      onClick={() => setSelectedPersonId(person.id)}
                    >
                      <div className="flex items-center">
                        {person.photoURL && (
                          <img 
                            src={person.photoURL} 
                            alt={person.nickname} 
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">{person.nickname}</div>
                          {person.features && (
                            <div className="text-sm text-gray-600 dark:text-gray-300">{person.features}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-2 text-gray-500 dark:text-gray-400">
                    {existingPeople.length === 0 ? '登録された人がいません' : '該当する人が見つかりません'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="locationDescription">
                位置情報の説明
              </label>
              <input
                id="locationDescription"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="例: 昼間の居場所、夜間の寝床"
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                位置情報：緯度 {location.lat.toFixed(6)}, 経度 {location.lng.toFixed(6)}
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded focus:shadow-outline mr-2"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedPersonId}
                className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 text-white font-bold py-2 px-4 rounded focus:shadow-outline disabled:opacity-50"
              >
                {isSubmitting ? '追加中...' : '場所を追加'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 