#!/bin/zsh
set -e
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker Desktopをインストールして起動してください。"
  exit 1
fi

if [ ! -f .env ]; then
  password="$(openssl rand -base64 32 | tr '+/' 'AB' | tr -d '=')"
  cat > .env <<EOF
POSTGRES_DB=mitsumori
POSTGRES_USER=mitsumori
POSTGRES_PASSWORD=$password
POSTGRES_PORT=5433
APP_PORT=8766
EOF
fi

docker compose up -d --build

for attempt in {1..60}; do
  if curl -fsS "http://127.0.0.1:8766/api/health" | grep -q '"dataReady":true'; then
    open "http://127.0.0.1:8766/"
    echo "見積りアプリを開きました。保存先はPostgreSQLです。"
    exit 0
  fi
  sleep 2
done

echo "起動確認に時間がかかっています。Docker Desktopの画面を確認してください。"
exit 1
