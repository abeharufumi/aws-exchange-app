graph TD
subgraph "Infrastructure Layer (Security)"
WAF[AWS WAF] --> CF[CloudFront]
CF --> ECS[ECS Fargate]
end

    subgraph "AI Core Layer"
        ECS -->|boto3| Bedrock[Amazon Bedrock]
        Bedrock -->|ベクトルデータ| RDS[(RDS PostgreSQL + pgvector)]
    end

    subgraph "Application Feature"
        RDS -->|類似度検索| Recommend[AIレコメンドAPI]
        Recommend -->|UI表示| User[ユーザー体験の向上]
    end
