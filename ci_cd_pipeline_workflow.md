# CI/CD パイプライン ワークフロー図

自動テスト（CI）から自動デプロイ（CD）までの流れを可視化したフロー図です。
GitHubにコードをPushした際、どのような順番でテストとデプロイが行われるかを示しています。

```mermaid
graph TD
    A[🧑‍💻 開発者がコードをPush<br>Branch: main] --> B{GitHub Actionsトリガー}

    subgraph CI [フェーズ3: 自動テスト工程 CI test.yml]
        B --> C[📦 依存関係の環境構築<br>Python/pip install]
        C --> D[🗄️ テスト用データベースの準備<br>モックまたはテストDB]
        D --> E[🧪 自動テスト実行<br>pytest]
    end

    E --> F{テスト結果は？}

    F -->|❌ 失敗 Error| G[🛑 パイプライン即時停止<br>不具合のあるコードの本番流出を防ぐ]

    F -->|✅ 成功 Pass| H[🚀 デプロイ工程へ移行]

    subgraph CD [フェーズ4: 自動デプロイ工程 CD deploy.yml]
        H --> I[🔑 AWS認証情報セットアップ]
        I --> J[🐳 Dockerイメージのビルド]
        J --> K[📦 Amazon ECRへイメージをPush]
        K --> L[🔄 Amazon ECSのサービス更新]
    end

    L --> M[🌐 本番環境へ安全にデプロイ完了！]

    classDef success fill:#d4edda,stroke:#28a745,stroke-width:2px;
    classDef error fill:#f8d7da,stroke:#dc3545,stroke-width:2px;
    classDef process fill:#e2e3e5,stroke:#6c757d;
    classDef ci fill:#e0f3ff,stroke:#0056b3,stroke-dasharray: 5 5;
    classDef cd fill:#fff3cd,stroke:#ffc107,stroke-dasharray: 5 5;

    class E process
    class G error
    class M success
```

## 各工程の解説

1. **🧑‍💻 Push**: あなたが手元で修正したコードを `main` ブランチにPushすると、GitHubがそれを検知して自動的にプロセス（Workflow）を開始します。
2. **🧪 テスト工程 (CI)**: `test.yml` という設定ファイルに基づいて、GitHubのサーバー上であなたの書いたバックエンドのプログラムが立ち上がり、Pytest（自動テスト）が実行されます。
3. **🛑 防止機能**: もし誰かがバグの混入したコードをPushしてしまった場合、テスト工程で「失敗（❌）」となり、**その時点でデプロイ処理は強制キャンセル**されます。これにより、本番環境が壊れるのを未然に防ぎます。
4. **🚀 デプロイ工程 (CD)**: テストが「100%成功（✅）」した場合のみ、すでに作成済みの `deploy.yml` の処理が動き出し、AWSのECSへと新しいコンテナが自動的に展開されます。
