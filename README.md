# OIKOS Support Map

OIKOS Support Map は、慶應義塾大学公認学生団体SAL・OIKOSプロジェクトのための、路上生活者支援活動管理アプリケーションです。

## 主な機能

- 路上生活者の居場所のマッピング
- 個人情報と対話内容の記録・管理
- 音声記録と自動要約による効率的な情報収集

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Firebase (Authentication, Firestore, Storage)
- Google Maps API
- Web Speech API (音声認識)
- TensorFlow.js (テキスト要約)

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd oikos-support-map
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルをプロジェクトのルートに作成し、以下の環境変数を設定します：

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 4. Firebaseプロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com/) で新しいプロジェクトを作成
2. Authentication で Google ログインを有効化
3. Firestore Database を作成し、以下のコレクションを設定:
   - `homelessPeople` - 路上生活者の情報
   - `conversations` - 会話の記録

### 5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で実行されます。

### 6. 本番用ビルド

```bash
npm run build
npm start
```

## 使用方法

1. Google アカウントでログイン
2. マップ上で路上生活者の位置を確認
3. マップをクリックして新しい路上生活者を登録
4. 各人物の詳細ページで情報閲覧・会話記録が可能

## ブラウザの互換性

音声認識機能は Web Speech API を使用しているため、以下のブラウザでサポートされています：
- Google Chrome
- Microsoft Edge
- Safari (macOS)
- Firefox (一部機能に制限あり)

最新のブラウザを使用することを推奨します。

## 注意事項

- 個人情報の取り扱いには十分注意してください
- プライバシー保護のため、実名は使用せずニックネームのみを記録
- アプリケーションへのアクセスは許可された OIKOS メンバーのみに制限
- 音声認識と要約の精度は環境やブラウザにより異なります。必要に応じて手動で編集してください

## ライセンス

Copyright (c) OIKOS Project - All Rights Reserved