# 家のチャッピーへの引き継ぎメモ

このプロジェクトは、チバテン専用の3D AI秘書アバターを作る作業です。

## まずやること

家のPCで、同じDropbox内の次のフォルダを開いてください。

`kensetsu-ai-project`

最初に読むファイル:

`HOME_PC_CONTINUE.md`

引き継ぎ画像一覧:

`HANDOFF_IMAGES.md`

その後、3Dアバターを表示するには次をダブルクリックしてください。

`START_3D_AVATAR_HOME_PC.bat`

## 関連ChatGPT共有リンク

家のPCで会話の流れを確認したい場合は、次の共有リンクも開いてください。

- `https://chatgpt.com/s/m_6a596dbfdc308191bfa8d6a25e918642`
- `https://chatgpt.com/s/m_6a596ddd46788191938c921ae6541ee8`

## 現在の最新モデル

最新のVRMモデル:

`apps/avatar_3d_vrm/models/chibaten_field_secretary_accessories_v1.vrm`

現在できている内容:

- 髪型確定済み
- teal/white 作業ジャケット風
- ヘッドセット付き
- タブレット付き
- 自然立ち姿勢
- 表情ボタンあり
- まばたきあり
- Talkボタンで簡易口パクあり

3D表示ページ:

`http://127.0.0.1:8766/viewer/index.html?expr=show`

デスクトップ表示:

`http://127.0.0.1:8766/viewer/index.html?desktop=1`

## 目標

参考動画くらいの、VTuber配信モデル級の精度に近づけたいです。

参考:

`https://www.youtube.com/shorts/zwUlmmj5FrQ`

ただし、参考キャラをコピーするのではなく、チバテン専用のオリジナル建設サポート秘書として品質を上げます。

詳しい工程表:

`apps/avatar_3d_vrm/production/VTUBER_QUALITY_TARGET.md`

## 次に進めたい作業

優先順位:

1. 顔の見た目を良くする
2. 目のハイライトと表情を自然にする
3. タブレットの持ち方を自然にする
4. ヘッドセットをもう少し細かくする
5. 服をパーカー感から作業ジャケット感へ近づける
6. 音声と口パクを連携する

## 家のPC側で必要なもの

表示だけなら:

- Python
- Edge または Chrome
- インターネット接続

Blenderで編集するなら:

- Blender 4.5 LTS
- Blender拡張 `VRM format`

## 家のチャッピーへの依頼文

以下をそのままチャッピーに伝えてください。

---

チバテンAI秘書の3Dアバター制作を続きからお願いします。

同じDropboxの `kensetsu-ai-project` に作業データがあります。

まず `HOME_PC_CONTINUE.md` と `apps/avatar_3d_vrm/production/VTUBER_QUALITY_TARGET.md` を読んで、現在の状態を確認してください。

最新モデルは `apps/avatar_3d_vrm/models/chibaten_field_secretary_accessories_v1.vrm` です。

3D表示は `START_3D_AVATAR_HOME_PC.bat` で起動できます。

目標は、参考動画くらいのVTuber配信モデル級の品質です。ただし参考キャラはコピーせず、チバテン専用のオリジナル建設サポート秘書として品質を上げてください。

次は、顔、目、タブレットの持ち方、ヘッドセット、服の形を改善するところから進めてください。

---
