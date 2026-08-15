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

test("SEO: meta description があり空でない", async ({ page }) => {
  await page.goto(APP_URL);
  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveCount(1);
  const content = await description.getAttribute("content");
  expect(content?.trim()).toBeTruthy();
});

test("SEO: JSON-LD に WebApplication の必須フィールドがある", async ({ page }) => {
  await page.goto(APP_URL);
  const raw = await page.locator('script[type="application/ld+json"]').evaluateAll(
    (scripts) => scripts.map((el) => el.textContent ?? ""),
  );
  expect(raw.length).toBeGreaterThan(0);

  const app = raw
    .flatMap((text) => {
      try {
        return [JSON.parse(text) as unknown];
      } catch {
        return [];
      }
    })
    .flatMap(collectJsonLdNodes)
    .find(isWebApplication);

  expect(app).toBeDefined();
  expect(typeof app?.name).toBe("string");
  expect(String(app?.name).trim()).toBeTruthy();
  expect(typeof app?.description).toBe("string");
  expect(String(app?.description).trim()).toBeTruthy();
  expect(typeof app?.url).toBe("string");
  expect(String(app?.url).trim()).toBeTruthy();
  expect(typeof app?.applicationCategory).toBe("string");
  expect(String(app?.applicationCategory).trim()).toBeTruthy();
  const offers = app?.offers as { price?: unknown } | undefined;
  expect(String(offers?.price)).toBe("0");
});

test("SEO: 使い方と FAQ のセクションがある", async ({ page }) => {
  await page.goto(APP_URL);
  await expect(page.getByRole("heading", { name: "使い方" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "FAQ" })).toBeVisible();
});

function collectJsonLdNodes(node: unknown): Record<string, unknown>[] {
  if (Array.isArray(node)) return node.flatMap(collectJsonLdNodes);
  if (!node || typeof node !== "object") return [];
  const obj = node as Record<string, unknown>;
  const nested = obj["@graph"] != null ? collectJsonLdNodes(obj["@graph"]) : [];
  return [obj, ...nested];
}

function isWebApplication(node: Record<string, unknown>): boolean {
  const type = node["@type"];
  const types = Array.isArray(type) ? type : [type];
  return types.includes("WebApplication");
}
