# PLAN — クイックメモ

## 1. 概要

開いた瞬間にカーソルが当たっていて、1秒で書き始められるブラウザ上のメモ帳を作る。入力内容はキー入力のたびに自動で localStorage に保存され、ブラウザを閉じて開き直しても直前の内容がそのまま復元される。保存ボタンもファイル選択もない、テキストエリア1つと全消去ボタンだけの単一ページアプリ。

## 2. 意図（明示）

作業中に頭をよぎった TODO や雑念を、アプリ選びや保存操作の摩擦なしに即書き捨てるための思考の一時置き場。
開いた瞬間にカーソルがあって1秒で書き始められることが価値。

## 3. 受け入れ条件

各条件に検証方法を併記する。すべて `tests/app.spec.ts` の Playwright テストで機械的に判定できる。

- [ ] AC1: ページを開くと入力欄（textarea）に自動でフォーカスが当たっており、クリックなしで即入力を開始できる
  - 検証: ページロード後、`document.activeElement` が textarea であることを確認する
- [ ] AC2: テキストを入力すると、明示的な保存操作なしで自動的に localStorage に保存される
  - 検証: textarea に文字列を入力後、`page.evaluate` で `localStorage.getItem('quick-notes:content')` が入力値と一致することを確認する
- [ ] AC3: ページをリロードしても、直前に入力した内容が入力欄に復元される
  - 検証: 入力 → `page.reload()` → textarea の値が入力値と一致することを確認する
- [ ] AC4: 全消去ボタンを押すと、入力欄の表示内容と localStorage の保存データが両方とも消える
  - 検証: 入力 → 全消去ボタンをクリック → textarea が空、かつ `localStorage.getItem('quick-notes:content')` が null であることを確認する
- [ ] AC5: 全消去後にリロードしても、消したはずの内容が復活しない（空のまま）
  - 検証: 入力 → 全消去 → `page.reload()` → textarea が空であることを確認する

## 4. 実装方針

`public/index.html` 単一ファイル（CSS/JS インライン、ビルドなし、外部ライブラリなし）で完結させる。

### レイアウト

- 画面ほぼ全面を占める `<textarea>` を主役に置く。装飾は最小限（ダーク寄りの落ち着いた配色、等幅でない読みやすいフォント）
- ヘッダーは小さくアプリ名と全消去ボタンのみ。テキストエリアの邪魔をしない
- 保存状態の小さなインジケータ（「保存済み」等）を控えめに表示し、自動保存が効いていることを伝える
- 縦方向の通常フロー（body を `flex-direction: column`）とし、最下部に AGENTS.md 指定の固定マークアップで hub フッター（`apps.jozo.beer`）を置く
- favicon は `<link rel="icon" href="data:image/svg+xml,...">` のインライン data URI（メモ帳テーマの絵柄、例: 鉛筆やメモ紙）

### 状態管理と主要関数

- localStorage キー: `quick-notes:content`（単一キーに本文文字列を保存）
- `restoreNote()` — 起動時に localStorage から本文を読み出して textarea に反映し、フォーカスを当てる。`DOMContentLoaded` で実行
- `saveNote()` — textarea の `input` イベントで本文を localStorage に書き込む。書き込みは軽量（文字列1本）なので debounce なしの即時保存とし、タイミング起因の保存漏れをなくす
- `clearNote()` — 全消去ボタンのハンドラ。textarea を空にし、localStorage のキーを削除し、フォーカスを textarea に戻す

### エッジケースの扱い

- localStorage が使えない環境（プライベートモード等で例外が出る場合）: 保存処理を try/catch で包み、アプリ本体（入力・表示）は例外なく動作継続する。保存インジケータは表示しない
- 空文字の保存: 全文字を削除した状態も「空文字を保存」として扱い、リロード後も空で復元される（全消去とは区別しない挙動で問題ない）
- 複数タブ同時編集の同期はスコープ外（最後に入力したタブの内容が残る、で許容）

### テスト

- `tests/app.spec.ts` に AC1〜AC5 それぞれに 1 対 1 対応する Playwright テストを追記する（雛形のスモークテストは削除せず残す）。リロード復元は `page.reload()` 後の値検証、localStorage の実データは `page.evaluate` で検証する
- `scripts/persist-test.mjs` の scenario / verify を「textarea に入力 → リロード → 内容一致」というこのアプリ固有の操作に書き換える

## 5. 制約遵守チェック（AGENTS.md 対応表)

| AGENTS.md の制約 | 本計画での対応 |
| --- | --- |
| バニラJS・単一 `public/index.html`・ビルドなし | 実装方針の冒頭で明記。フレームワーク・外部ライブラリは導入しない |
| 静的アプリ（`public/` 配下のみ）・サーバコード/外部APIなし | localStorage のみで完結。ネットワーク通信なし |
| 主要な状態を localStorage に永続化しリロード後復元 | AC2・AC3 で保証 |
| `scripts/persist-test.mjs` の scenario/verify 書き換え | テスト節に明記 |
| 受け入れ条件ごとのテスト追記・雛形スモークテスト維持 | テスト節に明記（AC と 1 対 1 対応） |
| favicon をインライン data URI で | レイアウト節に明記（メモ帳テーマの絵柄） |
| hub フッター（固定マークアップ・body flex 時は column） | レイアウト節に明記。body は `flex-direction: column` とし最下部に配置 |
| README.md を削除しない | README.md には触れない |
| apple-touch-icon / manifest / og-image / robots / sitemap は書かない | 生成しない（factory に委ねる） |

## 6. 完成条件

AC1〜AC5 をすべて満たし、`npm run verify` と `npm test` が通ること。
