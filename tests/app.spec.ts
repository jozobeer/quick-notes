import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";

// 静的アプリなのでサーバ不要。kojo の visualGate と同じ file:// 方式で開く
const APP_URL = pathToFileURL("public/index.html").href;
const STORAGE_KEY = "quick-notes:content";

test("ページがロードできページエラーが出ない", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto(APP_URL);
  await expect(page.locator("body")).toBeVisible();
  expect(errors).toEqual([]);
});

// このスモークは削除しないこと。機能テストは PLAN.md の受け入れ条件ごとに追記する

test("AC1: ページを開くと textarea に自動フォーカスが当たる", async ({ page }) => {
  await page.goto(APP_URL);
  const tag = await page.evaluate(() => document.activeElement?.tagName);
  expect(tag).toBe("TEXTAREA");
});

test("AC2: 入力すると localStorage に自動保存される", async ({ page }) => {
  await page.goto(APP_URL);
  const note = "自動保存の確認メモ";
  await page.locator("textarea").fill(note);
  const saved = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEY,
  );
  expect(saved).toBe(note);
});

test("AC3: リロード後も直前の内容が復元される", async ({ page }) => {
  await page.goto(APP_URL);
  const note = "リロード復元の確認メモ";
  await page.locator("textarea").fill(note);
  await page.reload();
  await expect(page.locator("textarea")).toHaveValue(note);
});

test("AC4: 全消去で textarea と localStorage が消える", async ({ page }) => {
  await page.goto(APP_URL);
  await page.locator("textarea").fill("消されるメモ");
  await page.getByRole("button", { name: "全消去" }).click();
  await expect(page.locator("textarea")).toHaveValue("");
  const saved = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEY,
  );
  expect(saved).toBeNull();
});

test("AC5: 全消去後のリロードでも内容は復活しない", async ({ page }) => {
  await page.goto(APP_URL);
  await page.locator("textarea").fill("消してリロード");
  await page.getByRole("button", { name: "全消去" }).click();
  await page.reload();
  await expect(page.locator("textarea")).toHaveValue("");
});
