#!/bin/bash
# Schemathesis テスト実行スクリプト

set -e

echo "========================================="
echo "Schemathesis API テスト"
echo "========================================="

# バックエンドが起動しているか確認
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ エラー: バックエンドが起動していません"
    echo "別ターミナルで以下を実行してください:"
    echo "  cd backend && .venv/bin/python -m uvicorn main:app --reload"
    exit 1
fi

echo "✅ バックエンドが起動中"

# テスト用ユーザーを作成してトークン取得
echo ""
echo "📝 テスト用ユーザーでトークン取得中..."

# ランダムなメールアドレスを生成（既存ユーザーとの衝突を避ける）
TEST_EMAIL="test_$(date +%s)@example.com"

# サインアップしてトークン取得
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/signup \
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
    schemathesis run http://localhost:8000/openapi.json \
        --checks all \
        --max-examples=10 \
        --seed=1
else
    echo "✅ トークン取得成功"
    echo ""
    echo "🚀 Schemathesisテスト実行中（認証あり）..."
    schemathesis run http://localhost:8000/openapi.json \
        --checks all \
        --max-examples=10 \
        --seed=1 \
        --header "Authorization: Bearer $TOKEN"
fi

echo ""
echo "========================================="
echo "テスト完了"
echo "========================================="
