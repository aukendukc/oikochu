import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  try {
    console.log('アップロード開始:', path);
    const storageRef = ref(storage, path);
    
    // メタデータを追加
    const metadata = {
      contentType: file.type,
      cacheControl: 'public,max-age=31536000',
    };
    
    // アップロード実行
    console.log('ファイルをアップロード中...');
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('アップロード完了:', snapshot);
    
    // ダウンロードURLを取得
    console.log('ダウンロードURLを取得中...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('ダウンロードURL取得成功:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Storage upload error:', error);
    throw new Error(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
};
