# AIコンシェルジュ（チャットボット）機能 実装仕様書

## 1. 概要

ユーザーのプロフィール添削やアプルの仕様に関する質問に応答するAIアシスタント機能（RAGベース）。
過去の会話コンテキストを保持し、ストリーミングで応答を返すモダンなAIアプリケーションとして、技術力をアピールできる設計とします。

## 2. データベース設計（スキーマ追加）

`pgvector` を利用してRAG用の知識ベースを保存し、セッション管理により会話履歴を保持します。

- **`ai_chat_sessions`**: ユーザーごとのチャット履歴のコンテナ（セッション）。
- **`ai_chat_messages`**: セッション内の具体的なやり取り（`role`: user / assistant）。
- **`ai_knowledge_base`**: FAQやアプリ仕様、モテるための定石などをベクトル化して保存しておくRAG用のナレッジテーブル。

## 3. 追加 API エンドポイント

- `GET /api/chatbot/sessions`: AIチャットセッション一覧の取得
- `POST /api/chatbot/sessions`: 新規AIチャットセッションの作成
- `GET /api/chatbot/sessions/{session_id}`: セッションに関するメッセージ履歴の取得
- `POST /api/chatbot/message`: メッセージ送信・ストリーミング応答 (Server-Sent Events または Fetch Streaming)

## 4. 実装ステップ

### Step 1: データベース拡張とナレッジデータの準備

1. `backend/schema.sql` に `ai_chat_sessions`, `ai_chat_messages`, `ai_knowledge_base` のテーブル定義を追加。
2. `backend/seed.sql` にダミーのFAQデータ（プレミアム機能、ランク制度、プロフの書き方のコツなど）を挿入。
3. `ai_knowledge_base` 内のテキストに対してBedrock (Titan Embeddings) を用いてベクトルを生成して初期登録するスクリプト・処理を構築。（既存のプロフィールベクトル化スクリプトを応用）
4. ER図 (`backend/schema-erd.md`) を更新。

### Step 2: バックエンド ロジックの実装

1. `backend/utils/bedrock_client.py` の拡張:
   - `invoke_model_with_response_stream` を使用したストリーミングジェネレータ関数を追加。
2. `backend/routers/chatbot.py` を新規作成:
   - セッションや履歴のCRUD処理（GET/POST）。
   - ストリーミングエンドポイント (`/message`) の構築。
3. **ストリーミングのパイプライン**:
   a. ユーザーの入力テキストを Bedrock (Titan) でベクトル化。
   b. `ai_knowledge_base` からコサイン類似度で関連文書を検索 (RAG)。
   c. ユーザーの現状のプロフィール情報を取得（添削用コンテキスト）。
   d. 過去の会話履歴を DB から取得。
   e. プロンプトを構築し、Bedrock (Nova-lite 等) へストリーミングリクエスト。
   f. FastAPI の `StreamingResponse` を用いてチャンクを返す。
   g. ストリーミング完了後やバックグラウンドタスクで、DBに `ai_chat_messages` を保存。
4. `main.py` に `chatbot.py` ルーターを登録。

### Step 3: フロントエンドの実装

1. **画面の作成**:
   - `app/(tabs)/ai_concierge.tsx` 等のエントリポイント作成（またはチャット一覧にタブを追加して配置）。
   - `app/chatbot/[sessionId].tsx` （AIチャット詳細画面）。
2. **コンポーネントの実装** (`src/screens/chatbot/`):
   - AIストリーミング描画対応のチャットバブルUI群。
3. **ストリーミング受信ロジック**:
   - Fetch API の `ReadableStream` を用いたストリーミングテキストの逐次表示ロジック（React state の更新）を実装。
   - `src/services/aiChatApi.ts` などに専用のAPI呼び出し関数を記述。

---

この手順に従うことで、RAGによる「外部データの取り込み」、Titanとpgvectorによる「自然言語検索」、Novaによる「文脈を理解した回答のストリーミング生成」というモダンなAIアーキテクチャ網羅して実装できます。
