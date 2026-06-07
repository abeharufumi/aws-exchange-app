#!/bin/bash
# ECSデプロイ完了を監視するスクリプト

CLUSTER="my-site-cluster"
SERVICE="my-site-service"
REGION="ap-northeast-1"

echo "========================================="
echo "ECSデプロイ状況監視"
echo "========================================="
echo ""

# 初期のタスク定義バージョンを取得
INITIAL_TASK_DEF=$(aws ecs describe-services \
  --cluster $CLUSTER \
  --services $SERVICE \
  --region $REGION \
  --query 'services[0].taskDefinition' \
  --output text)

echo "📊 現在のタスク定義: $INITIAL_TASK_DEF"
echo ""
echo "⏳ デプロイ完了を監視中..."
echo ""

# 最大30分（180回×10秒）監視
MAX_ATTEMPTS=180
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  # 現在の状態を取得
  SERVICE_INFO=$(aws ecs describe-services \
    --cluster $CLUSTER \
    --services $SERVICE \
    --region $REGION \
    --query 'services[0]' \
    --output json)
  
  CURRENT_TASK_DEF=$(echo $SERVICE_INFO | jq -r '.taskDefinition')
  RUNNING_COUNT=$(echo $SERVICE_INFO | jq -r '.runningCount')
  DESIRED_COUNT=$(echo $SERVICE_INFO | jq -r '.desiredCount')
  DEPLOYMENTS=$(echo $SERVICE_INFO | jq -r '.deployments | length')
  PRIMARY_DEPLOYMENT=$(echo $SERVICE_INFO | jq -r '.deployments[] | select(.status=="PRIMARY")')
  
  # デプロイ進行状況を表示
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$TIMESTAMP] タスク定義: $(basename $CURRENT_TASK_DEF) | 実行中: $RUNNING_COUNT/$DESIRED_COUNT | デプロイ数: $DEPLOYMENTS"
  
  # デプロイ完了条件：
  # 1. タスク定義が変更された
  # 2. デプロイが1つのみ（PRIMARY）
  # 3. 実行中タスク数 = 希望タスク数
  if [ "$CURRENT_TASK_DEF" != "$INITIAL_TASK_DEF" ] && \
     [ "$DEPLOYMENTS" -eq "1" ] && \
     [ "$RUNNING_COUNT" -eq "$DESIRED_COUNT" ]; then
    echo ""
    echo "========================================="
    echo "✅ デプロイ完了！"
    echo "========================================="
    echo ""
    echo "新しいタスク定義: $CURRENT_TASK_DEF"
    echo "実行中タスク数: $RUNNING_COUNT"
    echo ""
    echo "🌐 本番環境URL:"
    echo "http://my-site-alb-954668784.ap-northeast-1.elb.amazonaws.com"
    echo ""
    echo "📝 本番環境テストを実行:"
    echo "  cd backend && ./run_schemathesis_production.sh"
    echo ""
    exit 0
  fi
  
  # 10秒待機
  sleep 10
  ATTEMPT=$((ATTEMPT + 1))
done

echo ""
echo "⚠️  タイムアウト: 30分経過してもデプロイが完了しませんでした"
echo "手動で確認してください:"
echo "  aws ecs describe-services --cluster $CLUSTER --services $SERVICE --region $REGION"
exit 1
