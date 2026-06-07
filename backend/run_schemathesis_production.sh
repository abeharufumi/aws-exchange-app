#!/bin/bash
# Schemathesis 本番環境テスト実行スクリプト

set -e

# 本番ALBエンドポイント
PRODUCTION_URL="http://my-site-alb-954668784.ap-northeast-1.elb.amazonaws.com"

echo "========================================="
echo "Schemathesis 本番環境APIテスト"
echo "========================================="

# 本番環境が起動しているか確認
if ! curl -s ${PRODUCTION_URL}/health > /dev/null; then
    echo "❌ エラー: 本番環境に接続できません"
    echo "URL: ${PRODUCTION_URL}/health"
    exit 1
fi

echo "✅ 本番環境に接続成功"

# テスト用ユーザーを作成してトークン取得
echo ""
echo "📝 テスト用ユーザーでトークン取得中..."

# ランダムなメールアドレスを生成
TEST_EMAIL="test_$(date +%s)@example.com"

# サインアップしてトークン取得
SIGNUP_RESPONSE=$(curl -s -X POST ${PRODUCTION_URL}/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"test1234\",
    \"gender\": \"male\",
    \"display_name\": \"TestUser\"
  }")

TOKEN=$(echo $SIGNUP_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "⚠️  警告: トークン取得失敗。認証なしでテスト実行します"
    echo ""
    echo "🚀 Schemathesisテスト実行中（認証なし）..."
    schemathesis run ${PRODUCTION_URL}/openapi.json \
        --checks all \
        --max-examples=10 \
        --seed=1
else
    echo "✅ トークン取得成功"
    echo ""
    echo "🚀 Schemathesisテスト実行中（認証あり）..."
    schemathesis run ${PRODUCTION_URL}/openapi.json \
        --checks all \
        --max-examples=10 \
        --seed=1 \
        --header "Authorization: Bearer $TOKEN"
fi

echo ""
echo "========================================="
echo "本番環境テスト完了"
echo "========================================="
