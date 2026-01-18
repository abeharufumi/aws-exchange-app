# AWS Exchange App - フェーズ 1 (🔴P1) 実装ガイド

## 実装完了状況

### Backend ✅

- **database.py**: PostgreSQL 接続管理、SessionLocal、init_db()
- **models.py**: P1 の 12 ORM モデル
  - User, UserProfile, UserRank
  - MatchingRequest, MatchingReplies
  - ChatMessage, MeetRequest
  - QRToken, CompletedMeet
  - Review, Notification, Footprint
- **main.py**: FastAPI サーバー (42 個の P1 API エンドポイント)
  - POST /auth/signup (🔴P1-03)
  - POST /auth/login (🔴P1-02)
  - GET /users/search (🔴P1-11 ~ P1-15)
  - POST /matching/request (🔴P1-19)
  - GET /chat/{user_id}/messages (🔴P1-23, P1-88)
  - POST /chat/{user_id}/messages (🔴P1-30)
  - POST /meet/request (🔴P1-41)
  - POST /qr/generate (🔴P1-65, P1-66)
  - POST /verify (🔴P1-68, P1-69)
  - POST /review (🔴P1-82, P1-83)
  - GET /notifications (🟠P2-46)
- **migrations.sql**: P1 + P2 SQL マイグレーション
- **requirements.txt**: Python 依存パッケージ

### Frontend (React Native/Expo) ✅

- **RootNavigator.tsx**: タブナビゲーション構造 (🔴P1-05, P1-06)
  - Auth Stack (ログイン/サインアップ)
  - Main Tabs (ホーム、検索、通知、プロフィール)

#### 認証画面

- **LoginScreen.tsx** (🔴P1-02): メール/パスワードログイン
- **SignupScreen.tsx** (🔴P1-03): 新規登録 (性別、電話番号、メール、パスワード、ニックネーム)

#### メイン画面

- **TimelineScreen.tsx** (🔴P1-07 ~ P1-09): タイムライン・ユーザーカード表示

  - カード表示、いいね/スキップボタン
  - 地域ベースの検索
  - マッチング依頼送信

- **ChatScreen.tsx** (🔴P1-23, P1-30): チャット画面

  - メッセージ取得/送信
  - ポーリング実装 (3 秒毎)
  - 送信上限チェック

- **QRScreen.tsx** (🔴P1-65 ~ P1-72): QR 読み取り確認

  - Expo Camera で QR スキャン
  - 位置情報確認 (100m 判定)
  - デート完了メッセージ

- **ReviewScreen.tsx** (🔴P1-74 ~ P1-85): レビュー投稿

  - 5 段階星評価
  - コメント入力
  - ポイント加算ルール表示

- **SearchScreen.tsx** (🔴P1-11 ~ P1-15): 詳細検索

  - 年齢、ランク フィルター

- **NotificationScreen.tsx** (🟠P2-46 ~ P2-52): 通知センター

  - マッチング依頼、デート予約通知
  - ポーリング実装 (5 秒毎)

- **ProfileScreen.tsx** (🔴P1-94 ~ P1-101): プロフィール表示
  - ユーザー情報、ランク、デート数、評価
  - 自分のプロフィールならログアウト

#### ストア

- **authStore.ts**: Zustand を使った認証状態管理
  - ログイン/ログアウト
  - トークン永続化 (AsyncStorage)
  - ユーザー情報管理

## 起動方法

### Backend

```bash
# 依存パッケージ インストール
cd backend
pip install -r requirements.txt

# PostgreSQL セットアップ (初回のみ)
python -c "from database import init_db; init_db()"

# FastAPI サーバー起動
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
# 依存パッケージ インストール
cd frontend
npm install --legacy-peer-deps

# Expo 起動 (Web ブラウザ)
npm run web

# または
# iOS: npm run ios
# Android: npm run android
```

## 環境変数設定

### Backend (.env)

```
DATABASE_URL=postgresql://user:password@localhost/aws_exchange_app
SECRET_KEY=your-secret-key-change-in-production
ENVIRONMENT=development
```

### Frontend (.env)

```
EXPO_PUBLIC_API_URL=http://localhost:8000
```

## API エンドポイント一覧

### 認証

- `POST /auth/signup` - サインアップ
- `POST /auth/login` - ログイン

### 検索・発見

- `GET /users/search` - ユーザー検索
- `GET /users/{user_id}` - プロフィール取得

### マッチング

- `POST /matching/request` - マッチング依頼
- `POST /matching/{request_id}/accept` - マッチング承諾

### チャット

- `GET /chat/{user_id}/messages` - メッセージ取得
- `POST /chat/{user_id}/messages` - メッセージ送信

### デート

- `POST /meet/request` - デート予約
- `POST /meet/{request_id}/accept` - デート承諾

### QR・確認

- `POST /qr/generate` - QR トークン生成
- `POST /verify` - QR 検証

### レビュー

- `POST /review` - レビュー投稿

### 通知

- `GET /notifications` - 通知取得

### ヘルス

- `GET /health` - ヘルスチェック

## 次のステップ (🟠P2)

1. **メッセージ送信上限** - ランク別の詳細な上限実装
2. **ブースト機能** - 30 分表示優先度 UP
3. **プレミアム課金** - 月額 ¥980 継続課金
4. **アイコンフレーム** - 購入・付替機能
5. **足跡履歴** - 訪問者追跡
6. **受信フィルター** - ランク・マナー点フィルター
7. **共有機能** - ランク SNS シェア

---

🔴P1 フェーズ実装完了！
