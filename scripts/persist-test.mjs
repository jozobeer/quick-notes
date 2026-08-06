// L1 永続化検証シナリオ。kojo の persistGate が chromium 上で実行する:
//   1. scenario(page) — アプリを操作し、localStorage に保存されるべき状態を作る
//   2. （kojo 側が page.reload() する）
//   3. verify(page) — リロード後の復元状態を検証する。不一致なら throw すること
// page は Playwright の Page。セレクタはこのアプリの実装に合わせて書き換える。

const SAMPLE = "persist-gate: quick-notes sample";

export async function scenario(page) {
  await page.locator("textarea").fill(SAMPLE);
}

export async function verify(page) {
  const value = await page.locator("textarea").inputValue();
  if (value !== SAMPLE) {
    throw new Error(`expected ${JSON.stringify(SAMPLE)}, got ${JSON.stringify(value)}`);
  }
}
