import { test, expect, type Page } from "@playwright/test";
import { pathToFileURL } from "node:url";

// 静的アプリなのでサーバ不要。kojo の visualGate と同じ file:// 方式で開く
const APP_URL = pathToFileURL("public/index.html").href;
const STORAGE_KEY = "quick-notes:content";

function uniqueNote(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function storageGet(page: Page) {
  return page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
}

async function storageKeyCount(page: Page) {
  return page.evaluate(() => localStorage.length);
}

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

test("元に戻す AC1: 非空メモを全消去すると元に戻すボタンが出る", async ({ page }) => {
  await page.goto(APP_URL);
  const note = uniqueNote("消される前の内容");
  await page.locator("#note").fill(note);
  await page.locator("#clear").click();

  await expect(page.locator("#note")).toHaveValue("");
  expect(await storageGet(page)).toBeNull();
  const undo = page.getByTestId("undo-clear");
  await expect(undo).toBeVisible();
  await expect(undo).toHaveRole("button");
  await expect(undo).toHaveText("元に戻す");
});

test("元に戻す AC2: 元に戻すを押すと消す前の内容が復元される", async ({ page }) => {
  await page.goto(APP_URL);
  const note = uniqueNote("消される前の内容");
  await page.locator("#note").fill(note);
  await page.locator("#clear").click();
  await page.getByTestId("undo-clear").click();

  await expect(page.locator("#note")).toHaveValue(note);
  expect(await storageGet(page)).toBe(note);
  await expect(page.getByTestId("undo-clear")).toBeHidden();
});

test("元に戻す AC3: 全消去直後のリロードでは元に戻すを持ち越さない", async ({ page }) => {
  await page.goto(APP_URL);
  await page.locator("#note").fill(uniqueNote("消してリロード"));
  await page.locator("#clear").click();

  await expect(page.locator("#note")).toHaveValue("");
  expect(await storageGet(page)).toBeNull();
  const keysAfterClear = await storageKeyCount(page);

  await page.reload();

  await expect(page.locator("#note")).toHaveValue("");
  expect(await storageGet(page)).toBeNull();
  const undo = page.getByTestId("undo-clear");
  await expect(undo).toBeAttached();
  await expect(undo).toBeHidden();
  expect(await storageKeyCount(page)).toBeLessThanOrEqual(keysAfterClear);
});

test("元に戻す AC4: 全消去後の入力と空欄の全消去では退避を壊さない", async ({ page }) => {
  await page.goto(APP_URL);
  const original = uniqueNote("消される前の内容");
  await page.locator("#note").fill(original);
  await page.locator("#clear").click();
  await expect(page.getByTestId("undo-clear")).toBeVisible();
  await page.locator("#note").fill("x");
  await expect(page.getByTestId("undo-clear")).toBeHidden();
  await expect(page.locator("#note")).toHaveValue("x");
  expect(await storageGet(page)).toBe("x");

  await page.goto(APP_URL);
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload();
  await expect(page.locator("#note")).toHaveValue("");
  await page.locator("#clear").click();
  await expect(page.getByTestId("undo-clear")).toBeAttached();
  await expect(page.getByTestId("undo-clear")).toBeHidden();

  await page.locator("#note").fill(original);
  await page.locator("#clear").click();
  await expect(page.getByTestId("undo-clear")).toBeVisible();
  await page.locator("#clear").click();
  await page.getByTestId("undo-clear").click();
  await expect(page.locator("#note")).toHaveValue(original);
});

test("元に戻す AC5: 全消去のラベルとステータスと FAQ 案内を維持する", async ({ page }) => {
  await page.goto(APP_URL);
  const clear = page.locator("#clear");
  await expect(clear).toHaveText("全消去");
  await page.locator("#note").fill(uniqueNote("ステータス確認"));
  await expect(page.locator("#status")).toHaveText("保存済み");
  await clear.click();
  await expect(page.locator("#status")).toHaveText("消去済み");

  const faq = page.locator("#faq");
  await expect(faq.getByText("全消去したメモは戻せますか？")).toBeVisible();
  await expect(faq).toContainText("全消去の直後");
  await expect(faq).toContainText("元に戻す");
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
