#!/bin/zsh
set -e
cd "$(dirname "$0")"

mkdir -p backups
destination="backups/mitsumori-$(date +%Y%m%d-%H%M%S).json"
curl -fsS "http://127.0.0.1:8766/api/export" -o "$destination"
echo "バックアップを保存しました: $destination"
