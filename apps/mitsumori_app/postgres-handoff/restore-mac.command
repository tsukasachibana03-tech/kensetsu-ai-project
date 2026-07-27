#!/bin/zsh
set -e
cd "$(dirname "$0")"

backup_file="$(find backups -maxdepth 1 -name '*.json' -type f -print | sort | tail -n 1)"
if [ -z "$backup_file" ]; then
  echo "backupsフォルダーに復元用データがありません。"
  exit 1
fi

curl -fsS \
  -H "Content-Type: application/json" \
  --data-binary "@$backup_file" \
  "http://127.0.0.1:8766/api/import"
echo
echo "最新バックアップを復元しました。"
