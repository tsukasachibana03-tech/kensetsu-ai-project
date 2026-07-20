# 家のPCで続きを作業する手順

## まず確認

家のPCで同じDropboxを使っている場合は、Dropboxの同期が終わるまで待ってください。

このフォルダが家のPCにも出ていれば、そのまま続きから作業できます。

`kensetsu-ai-project`

## 3Dアバターを見る

家のPCで次のファイルをダブルクリックしてください。

`START_3D_AVATAR_HOME_PC.bat`

または、直接こちらを開いても大丈夫です。

`apps/avatar_3d_vrm/run_3d_avatar_desktop.bat`

起動すると、3Dアバター表示ページが開きます。

## 必要なもの

表示だけなら、基本は次があれば動きます。

- Microsoft Edge または Chrome
- Python
- インターネット接続

もし「Pythonが見つかりません」と出たら、家のPCにPythonを入れてからもう一度実行してください。

## Blenderで編集を続ける場合

家のPCにもBlenderを入れてください。

推奨:

- Blender 4.5 LTS
- Blender拡張: `VRM format`

Blenderで続きを編集する元モデル:

`apps/avatar_3d_vrm/models/chibaten_field_secretary_accessories_v1.vrm`

## 現在の状態

現在入っているもの:

- 髪型確定版
- teal/white作業ジャケット風
- ヘッドセット
- タブレット
- 自然立ち姿勢
- 表情ボタン
- まばたき
- Talkで簡易口パク

## 次にやること

目標はVTuberモデル級の精度です。

次の改善ポイント:

- 顔の造形
- 目のハイライト
- 服の形
- タブレットの持ち方
- ヘッドセットの質感
- 口パクと音声連携

工程表:

`apps/avatar_3d_vrm/production/VTUBER_QUALITY_TARGET.md`

家のチャッピーに引き継ぐ場合:

`HOME_CHAPPY_HANDOFF_PROMPT.md`

関連ChatGPT共有リンク:

- `https://chatgpt.com/s/m_6a596dbfdc308191bfa8d6a25e918642`
- `https://chatgpt.com/s/m_6a596ddd46788191938c921ae6541ee8`
