# クイックメモ

開いた瞬間に書き始められるブラウザメモ帳。本文は `localStorage` キー `quick-notes:content` に自動保存され、リロード後も復元される。UI はヘッダー（アプリ名・ステータス・全消去）と全面の textarea、hub フッターのみ。実装は `public/index.html` 単一ファイルに完結している。

## 構成

- `public/index.html` — アプリ本体（CSS/JS インライン）
- `tests/app.spec.ts` — スモーク + AC1〜AC5 の Playwright テスト
- `scripts/verify.mjs` / `scripts/persist-test.mjs` — 不変条件・永続化の検証
- `wrangler.jsonc` — Cloudflare Workers assets 配信設定
- `PLAN.md` — 初回実装時の計画（歴史的文書）

## 技術スタック（不変）

- バニラJS・単一 `public/index.html`（CSS/JSインライン）・ビルドなし
- 配信: Cloudflare Workers assets（`wrangler.jsonc`）
- テスト: Playwright（`tests/app.spec.ts`、`npm test`）
- 保守時もこのスタックを維持すること。フレームワーク・ビルドツール・宣言外ライブラリの導入は禁止

## 品質不変条件

次を壊さないこと。変更後は `npm run verify` が通る状態を維持する。

- favicon は `<link rel="icon" href="data:image/svg+xml,...">` のインライン data URI（外部ファイル・外部 URL 不可）
- hub（apps.jozo.beer）へのフッター導線を維持する。リンク先 `https://apps.jozo.beer` とリンクテキスト `apps.jozo.beer` は変えない。スタイルはテーマに合わせて調整してよいが、背景とのコントラストを確保すること。body が flex/grid の場合はレイアウトが崩れない位置（`flex-direction: column` の通常フロー最下部など）に置く

その他の守るべき制約:

- 静的アプリ（`public/` 配下のみ）。サーバコード・外部 API・ビルドツールは使わない
- `public/index.html` を単一ファイルで完結させる（CSS/JS インライン可）
- 主要な状態を localStorage に永続化し、リロード後に復元すること
- 雛形のスモークテスト（ページロード・ページエラーなし）は削除しない
- README.md は削除しない
- apple-touch-icon / manifest / og-image / robots / sitemap は factory が公開時に自動生成するため、手書きしない

## 受け入れ条件（現状の正はテスト）

`tests/app.spec.ts` が仕様の正である。概要:

- AC1: ページを開くと textarea に自動フォーカス
- AC2: 入力すると `quick-notes:content` へ自動保存
- AC3: リロード後も直前の内容が復元される
- AC4: 全消去で textarea と localStorage が消える
- AC5: 全消去後のリロードでも内容は復活しない

## PLAN.md について

`PLAN.md` は初回実装時の計画であり歴史的文書である。現状の正は README.md と `tests/app.spec.ts` とする。受け入れ条件の追加・変更はテストを先に更新し、PLAN.md のチェックボックスを正として扱わない。

## 保守の進め方

1. 変更前に、追加・変更する振る舞いを受け入れ条件として `tests/app.spec.ts` に書く（または既存テストを更新する）
2. 実装する（`public/index.html` など）
3. `npm test` が通ることを確認する（必要なら `npm run verify` も）
4. `git commit` し `git push` する
5. `npm run deploy` で Cloudflare Workers へデプロイする
