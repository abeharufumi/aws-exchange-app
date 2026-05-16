【新規開発: AIレコメンド機能の実装ロードマップ】
BTM社の事例（Amazon Bedrock / pgvector活用）を参考に、アプリにAIレコメンドを導入します。
現在の技術スタック（FastAPI / PostgreSQL / ECS Fargate）を活かした最短の実装手順を提案してください。

1. データベースのベクトル対応 (pgvector):
   - schema.sql に `vector` 型のカラム（bio_embedding等）を追加し、
     既存の `execQuery.py` を通じてコサイン類似度検索を行うSQLクエリを設計してください。
2. Amazon Bedrock連携 (boto3):
   - `utils/ai_helper.py` を新規作成し、AWS SDK (boto3) を使って
     ユーザーの自己紹介文をベクトル化（Embedding）する共通関数を作成してください。
   - 使用モデルは `amazon.titan-embed-text-v2` を想定します。
3. レコメンドAPIの作成:
   - `routers/matches.py` または新規の `routers/recommend.py` を作成し、
     「ログインユーザーと意味的に近い趣味を持つユーザー」を上位表示するAPIを実装してください。
4. 非同期処理の検討:
   - プロフィール更新時にリアルタイムでベクトル化を行うための
     バックグラウンドタスク（FastAPIのBackgroundTasks等）の実装方法。
