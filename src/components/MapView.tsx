'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, GeoPoint, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import PersonForm from './PersonForm';
import PersonDetails from '@/components/PersonDetails';

// Types
interface HomelessPerson {
  id: string;
  nickname: string;
  location?: GeoPoint; // 古いデータ形式との互換性のために残す
  locations?: Array<{
    latitude: number;
    longitude: number;
    description?: string;
    timestamp?: string;
  }>;
  lastSeen: string;
  category: string;
  ageGroup?: string;
  features?: string;
  photoURL?: string;
}

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [homelessPeople, setHomelessPeople] = useState<HomelessPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<HomelessPerson | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  
  // ユーザーの現在位置を取得する関数
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          
          // 地図が既に読み込まれている場合
          if (map) {
            // 地図の中心を現在位置に移動
            map.setCenter(userPos);
            map.setZoom(16);
            
            // 既存のユーザーマーカーがあれば削除
            if (userMarkerRef.current) {
              userMarkerRef.current.setMap(null);
            }
            
            // 新しいユーザーマーカーを作成
            const marker = new google.maps.Marker({
              position: userPos,
              map: map,
              title: '現在地',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4285F4', // Googleブルー
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
                scale: 8
              }
            });
            
            userMarkerRef.current = marker;
          }
        },
        (error) => {
          console.error('位置情報の取得に失敗しました:', error);
          alert('位置情報の取得に失敗しました。ブラウザの位置情報へのアクセスを許可してください。');
        }
      );
    } else {
      alert('お使いのブラウザは位置情報をサポートしていません。');
    }
  };
  
  // Initialize Google Maps
  useEffect(() => {
    const loadMap = async () => {
      if (!mapRef.current) return;
      
      // Default center is Shinjuku Station
      const defaultCenter = { lat: 35.6896, lng: 139.7006 };
      
      // URLクエリパラメータから位置情報を取得
      const urlLat = searchParams.get('lat');
      const urlLng = searchParams.get('lng');
      const initialCenter = urlLat && urlLng 
        ? { lat: parseFloat(urlLat), lng: parseFloat(urlLng) }
        : defaultCenter;
      
      const mapOptions: google.maps.MapOptions = {
        center: initialCenter,
        zoom: urlLat && urlLng ? 18 : 16, // 特定の場所が指定されていれば大きく表示
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      };
      
      const newMap = new google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      
      // URLから位置が指定されていたらマーカーを追加
      if (urlLat && urlLng) {
        new google.maps.Marker({
          position: initialCenter,
          map: newMap,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: 'blue',
            fillOpacity: 0.8,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            scale: 8,
          }
        });
      }
      
      // Listen for click to add new marker
      google.maps.event.addListener(newMap, 'click', (event: google.maps.MapMouseEvent) => {
        if (user && event.latLng) {
          const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          
          // Clear any selected person when clicking on the map
          setSelectedPerson(null);
          setShowDetailsPopup(false);
          setClickedLocation(position);
          setShowForm(true);
        }
      });
      
      // ユーザーの現在位置を取得して表示
      getUserLocation();
    };
    
    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = loadMap;
    document.head.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [user, searchParams]);
  
  // カスタムイベントリスナーを設定
  useEffect(() => {
    // ポップアップから位置情報が渡された時の処理
    const handleShowLocation = (event: CustomEvent) => {
      if (!map) return;
      
      const { latitude, longitude } = event.detail;
      const position = { lat: latitude, lng: longitude };
      
      // 特定の場所にマップの中心を移動
      map.setCenter(position);
      map.setZoom(18);
      
      // 一時的なマーカーを追加
      const tempMarker = new google.maps.Marker({
        position,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: 'blue',
          fillOpacity: 0.8,
          strokeWeight: 1,
          strokeColor: '#ffffff',
          scale: 8,
        }
      });
      
      // 3秒後にマーカーを消す
      setTimeout(() => {
        tempMarker.setMap(null);
      }, 3000);
    };
    
    // イベントリスナーを追加
    window.addEventListener('show-location', handleShowLocation as EventListener);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('show-location', handleShowLocation as EventListener);
    };
  }, [map]);
  
  // Load homeless people data from Firestore
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'homelessPeople'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const people: HomelessPerson[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<HomelessPerson, 'id'>;
        people.push({
          id: doc.id,
          ...data,
        });
      });
      setHomelessPeople(people);
    });
    
    return () => unsubscribe();
  }, [user]);
  
  // Update markers when homelessPeople changes
  useEffect(() => {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    // Create new markers
    const newMarkers: google.maps.Marker[] = [];
    
    // 位置情報をグループ化
    const locationGroups: Record<string, Array<{
      person: HomelessPerson;
      location: {latitude: number; longitude: number; description?: string; timestamp?: string};
    }>> = {};
    
    homelessPeople.forEach(person => {
      // 位置情報の配列を取得
      let locations: Array<{latitude: number; longitude: number; description?: string; timestamp?: string}> = [];
      
      // 新しいデータ形式（locations配列）がある場合はそれを使用
      if (person.locations && person.locations.length > 0) {
        locations = person.locations;
      } 
      // 古いデータ形式（location）がある場合は変換
      else if (person.location) {
        locations = [{
          latitude: person.location.latitude,
          longitude: person.location.longitude,
          description: '元の位置',
          timestamp: new Date().toISOString()
        }];
      }
      
      // 各位置情報をグループ化
      locations.forEach(loc => {
        const key = `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`;
        if (!locationGroups[key]) {
          locationGroups[key] = [];
        }
        locationGroups[key].push({ person, location: loc });
      });
    });
    
    // 各グループに対してマーカーを作成
    Object.entries(locationGroups).forEach(([key, group]) => {
      const [lat, lng] = key.split(',').map(Number);
      const position = { lat, lng };
      
      // グループ内の最初の人物のカテゴリーを使用
      const category = group[0].person.category;
      const markerColors: Record<string, string> = {
        regular: '#ef4444', // 赤
        occasional: '#eab308', // 黄
        new: '#22c55e', // 緑
      };
      const color = markerColors[category] || markerColors.new;
      
      // Googleマップのピン表示に似せたマーカーアイコン
      const markerIcon = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: color,
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#ffffff',
        scale: 1.5,
        anchor: { x: 12, y: 24 } as any,
      };
      
      // マーカーのタイトルに人数を追加
      const title = group.length > 1 
        ? `${group.length}人のホームレス者がこの場所にいます`
        : `${group[0].person.nickname} - ${group[0].location.description || '位置情報'}`;
      
      const marker = new google.maps.Marker({
        position,
        map,
        title,
        icon: markerIcon
      });
      
      // Click event to show details
      marker.addListener('click', () => {
        // グループ内の人物が複数いる場合は選択ダイアログを表示
        if (group.length > 1) {
          // 選択ダイアログを表示するための状態を設定
          setSelectedPersonGroup(group);
          setShowPersonSelector(true);
        } else {
          // 1人の場合は直接詳細を表示
          setSelectedPerson(group[0].person);
          setSelectedPersonId(group[0].person.id);
          setShowDetailsPopup(true);
        }
      });
      
      newMarkers.push(marker);
    });
    
    setMarkers(newMarkers);
  }, [map, homelessPeople]);
  
  // 人物選択ダイアログの状態
  const [selectedPersonGroup, setSelectedPersonGroup] = useState<Array<{
    person: HomelessPerson;
    location: {latitude: number; longitude: number; description?: string; timestamp?: string};
  }>>([]);
  const [showPersonSelector, setShowPersonSelector] = useState(false);
  
  // 人物選択ダイアログを閉じる
  const handleClosePersonSelector = () => {
    setShowPersonSelector(false);
    setSelectedPersonGroup([]);
  };
  
  // 選択された人物の詳細を表示
  const handleSelectPerson = (person: HomelessPerson) => {
    setSelectedPerson(person);
    setSelectedPersonId(person.id);
    setShowDetailsPopup(true);
    setShowPersonSelector(false);
  };
  
  // Handle form submit success
  const handleFormSuccess = () => {
    setShowForm(false);
    setClickedLocation(null);
  };
  
  return (
    <div className="w-full h-[calc(100vh-64px)] relative">
      <div ref={mapRef} className="w-full h-full"></div>
      
      {/* 現在位置ボタン */}
      <button
        onClick={getUserLocation}
        className="absolute bottom-20 right-4 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg z-10 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="現在位置に移動"
        title="現在位置に移動"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      {/* 簡易情報ポップアップ */}
      {selectedPerson && !showDetailsPopup && (
        <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-10">
          <h2 className="text-xl font-bold dark:text-white">{selectedPerson.nickname}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">最終確認: {selectedPerson.lastSeen}</p>
          {selectedPerson.ageGroup && (
            <p className="text-sm text-gray-600 dark:text-gray-300">年齢層: {selectedPerson.ageGroup}</p>
          )}
          {selectedPerson.features && (
            <p className="text-sm text-gray-600 dark:text-gray-300">特徴: {selectedPerson.features}</p>
          )}
          <div className="flex justify-end mt-2">
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={() => setShowDetailsPopup(true)}
            >
              詳細を見る
            </button>
            <button 
              className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => setSelectedPerson(null)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
      
      {/* 詳細情報ポップアップ */}
      {showDetailsPopup && selectedPersonId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
            <div className="p-3 sm:p-4 bg-blue-500 dark:bg-blue-700 text-white flex justify-between items-center sticky top-0">
              <h2 className="text-lg sm:text-xl font-bold">
                {selectedPerson ? selectedPerson.nickname : '詳細情報'}
              </h2>
              <button 
                onClick={() => {
                  console.log('詳細ポップアップを閉じます');
                  setShowDetailsPopup(false);
                }}
                className="bg-white dark:bg-gray-200 text-blue-500 dark:text-blue-700 px-2 sm:px-3 py-1 rounded hover:bg-blue-100 dark:hover:bg-gray-300"
                data-close-popup
              >
                閉じる
              </button>
            </div>
            <div className="p-3 sm:p-4">
              {selectedPersonId ? (
                <PersonDetails 
                  key={selectedPersonId} 
                  personId={selectedPersonId} 
                  isPopup={true} 
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">データを読み込めませんでした</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 人物選択ダイアログ */}
      {showPersonSelector && selectedPersonGroup.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-3 sm:p-4">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 dark:text-white">この場所のホームレス者</h2>
            <div className="max-h-60 overflow-y-auto">
              {selectedPersonGroup.map((item, index) => (
                <div 
                  key={index} 
                  className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelectPerson(item.person)}
                >
                  <h3 className="font-medium dark:text-white">{item.person.nickname}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {item.location.description || '位置情報'} - {item.person.lastSeen}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 sm:mt-4 flex justify-end">
              <button 
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-3 sm:px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={handleClosePersonSelector}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showForm && clickedLocation && (
        <PersonForm 
          location={clickedLocation}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
} 