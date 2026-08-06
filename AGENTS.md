# クイックメモ

このリポジトリは kojo が生成した単一ページWebアプリです。

## アイデア

# クイックメモ

開いた瞬間に書けるメモ帳。書いた内容は自動保存され、ブラウザを閉じて開き直しても残っている。

## 意図

作業中に頭をよぎった TODO や雑念を、アプリ選びや保存操作の摩擦なしに即書き捨てるための思考の一時置き場。
開いた瞬間にカーソルがあって1秒で書き始められることが価値。

## 受け入れ条件の種

- テキストを入力すると自動で localStorage に保存される
- ページをリロードしても直前の内容が復元される
- 全消去ボタンで内容と保存データを消せる


## 技術スタック（不変）

- バニラJS・単一 `public/index.html`（CSS/JSインライン）・ビルドなし
- 配信: Cloudflare Workers assets（`wrangler.jsonc`）
- テスト: Playwright（`tests/app.spec.ts`、`npm test`）
- 保守時もこのスタックを維持すること。フレームワーク・ビルドツール・宣言外ライブラリの導入は禁止

## 制約

- 静的アプリ（`public/` 配下のみ）。サーバコード・外部API・ビルドツールは使わない
- `public/index.html` を単一ファイルで完結させる（CSS/JSインライン可）
- 主要な状態を localStorage に永続化し、リロード後に復元すること
- `scripts/persist-test.mjs` の scenario / verify をこのアプリ固有の操作に書き換えること（雛形のままでは検証が失敗する）
- PLAN.md の受け入れ条件それぞれに対応するテストを `tests/app.spec.ts` に追記し、`npm test` が通ること（雛形のスモークテストは削除しない）
- favicon を `<link rel="icon" href="data:image/svg+xml,...">` のインライン data URI で含める（外部ファイル・外部URL不可。アプリのテーマに合った絵柄にする）
- hub（apps.jozo.beer）へのフッター導線を入れる。マークアップは次のとおり固定する:

  ```html
  <footer style="margin-top:3rem;text-align:center;font-size:.8rem;opacity:.6">
    <a href="https://apps.jozo.beer" style="color:inherit">apps.jozo.beer</a>
  </footer>
  ```

  スタイル（リンク色を含む）はアプリのテーマに合わせて調整してよいが、リンク先 `https://apps.jozo.beer` とリンクテキスト `apps.jozo.beer` は変えない。リンク色を変える場合は背景とのコントラストを確保すること

  配置は縦方向の通常フローの最下部に統合する。body がセンタリングレイアウト（display:flex / display:grid で中央寄せ）の場合、`</body>` 直前に置くと footer がその flex/grid アイテムになりレイアウトが崩れる（row 方向 flex では横並びになる）ため、body を flex-direction: column にするか、センタリング済みメインコンテナ内の末尾に置くこと。それ以外の場合は `</body>` 直前でよい
- README.md はテンプレートが生成済み。削除しないこと
- apple-touch-icon / manifest / og-image / robots / sitemap は factory が公開時に自動生成するため、builder は書かない
- 完成条件: PLAN.md の受け入れ条件をすべて満たし、`npm run verify` と `npm test` が通ること
