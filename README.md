# クイックメモ

ブラウザで開いた瞬間に textarea へフォーカスが当たり、入力のたびに `localStorage`（キー: `quick-notes:content`）へ自動保存する単一ページのメモ帳。リロード後も直前の内容が復元され、「全消去」ボタンで表示と保存データをまとめて消せる。保存ボタンはなく、ヘッダーに「保存済み」「消去済み」の控えめなステータス表示がある。

## 公開URL

https://quick-notes.jozo.beer

## 開発

[kojo](https://github.com/jozobeer/kojo)（1日1アプリ自動生成基盤）により生成されたリポジトリです。

初回セットアップ: `npm install`（Playwright ブラウザ未取得の環境では `npx playwright install chromium`）

- `npm test` — Playwright によるブラウザテスト
- `npm run verify` — 不変条件チェック（favicon / apps.jozo.beer フッター）
- `npm run deploy` — Cloudflare Workers へデプロイ

## 構成

- `public/index.html` — アプリ本体（CSS/JSインラインの単一ファイル）
- `tests/app.spec.ts` — 受け入れ条件に対応する Playwright テスト
- `PLAN.md` — 初回実装時の計画（歴史的文書。現状の正は README とテスト）
