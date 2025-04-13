'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { format } from 'date-fns';
// TensorFlow.jsを動的インポートに変更
// import * as tf from '@tensorflow/tfjs';

interface ConversationRecorderProps {
  personId: string;
}

// Speech Recognition type definition
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Make sure TypeScript recognizes the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function ConversationRecorder({ personId }: ConversationRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [model, setModel] = useState<any | null>(null);
  const [apiSupported, setApiSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Check Web Speech API support and TensorFlow.js setup
  useEffect(() => {
    // Check if Web Speech API is supported
    const isSpeechRecognitionSupported = !!window.SpeechRecognition || !!window.webkitSpeechRecognition;
    setApiSupported(isSpeechRecognitionSupported);
    
    if (!isSpeechRecognitionSupported) {
      console.warn('Web Speech API is not supported in this browser');
    }
    
    // TensorFlow.js would be loaded here in a real application
    // We're simplifying by not using it for this prototype
    
    return () => {
      // Clean up
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  const startRecording = () => {
    if (!apiSupported) {
      alert('お使いのブラウザはWeb Speech APIをサポートしていません。Chrome、Edge、Safariなどの最新のブラウザをご使用ください。');
      return;
    }
    
    setTranscript('');
    setSummary('');
    setIsRecording(true);
    
    try {
      // Initialize Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition() as SpeechRecognition;
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP'; // Japanese language
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript !== '') {
          setTranscript((prev) => prev + finalTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
        setIsRecording(false);
        alert(`音声認識エラー: ${event.error || '不明なエラー'}`);
      };
      
      recognition.onend = () => {
        if (isRecording) {
          // If recording was stopped by stopRecording(), don't restart
          try {
            recognition.start();
          } catch (e) {
            console.error('再起動エラー:', e);
            setIsRecording(false);
          }
        }
      };
      
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      alert('音声認識の開始に失敗しました。ブラウザがWeb Speech APIをサポートしていない可能性があります。');
      setIsRecording(false);
    }
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Process the transcript to generate a summary
    if (transcript) {
      generateSummary(transcript);
    } else {
      setIsProcessing(false);
    }
  };
  
  // Generate summary using a simpler approach
  const generateSummary = async (text: string) => {
    try {
      // Simple rule-based approach for summarization
      // Split into sentences
      const sentences = text.split(/[。.!?！？]/g).filter(s => s.trim().length > 0);
      
      if (sentences.length === 0) {
        setSummary('会話の内容から要点を抽出できませんでした。手動で入力してください。');
        return;
      }
      
      // Basic extractive summarization: take the first few sentences as the summary
      const keyPoints = sentences.slice(0, Math.min(4, sentences.length))
        .map((sentence, index) => `${index + 1}. ${sentence.trim()}`);
      
      // Join the key points with newlines to create the summary
      const generatedSummary = keyPoints.join('\n');
      setSummary(generatedSummary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('要約の生成に失敗しました。手動で要約を入力してください。');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const saveConversation = async () => {
    if (!transcript || !summary) {
      alert('記録と要約を生成してください');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Add conversation to Firestore
      const conversationRef = await addDoc(collection(db, 'conversations'), {
        personId,
        transcript,
        summary,
        date: format(new Date(), 'yyyy/MM/dd'),
        timestamp: new Date().toISOString(),
      });
      
      // Update last seen date for the person
      await updateDoc(doc(db, 'homelessPeople', personId), {
        lastSeen: format(new Date(), 'yyyy/MM/dd HH:mm'),
      });
      
      alert('会話が保存されました');
      
      // Reset form
      setTranscript('');
      setSummary('');
    } catch (error) {
      console.error('Error saving conversation:', error);
      alert('会話の保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSummary(e.target.value);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">会話を記録</h2>
      
      {!apiSupported && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 mb-4">
          <p>お使いのブラウザは音声認識をサポートしていません。Chrome、Edge、またはSafariの最新版をご使用ください。</p>
        </div>
      )}
      
      <div className="mb-6">
        {isRecording ? (
          <div className="flex flex-col items-center">
            <div className="flex space-x-1 mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
            </div>
            <button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
            >
              録音を停止
            </button>
            <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">音声を認識しています...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={startRecording}
              className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
              disabled={isProcessing || isSaving}
            >
              {isProcessing ? '処理中...' : '録音を開始'}
            </button>
            <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
              ボタンをクリックして会話の録音を開始してください
            </p>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
          会話の記録:
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows={6}
          placeholder="録音した会話の文字起こしがここに表示されます。直接編集することもできます。"
          disabled={isRecording || isProcessing || isSaving}
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
          会話の要約:
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows={4}
          placeholder="会話の要点を自動的に抽出します。必要に応じて編集してください。"
          disabled={isRecording || isProcessing || isSaving}
        />
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={saveConversation}
          className="bg-green-500 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          disabled={isRecording || isProcessing || isSaving || !transcript || !summary}
        >
          {isSaving ? '保存中...' : '会話を保存'}
        </button>
      </div>
    </div>
  );
} 