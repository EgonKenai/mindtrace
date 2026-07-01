import { expect, test } from "@playwright/test";

test.describe("language switcher", () => {
  test("preserves the semantic path between Chinese and English", async ({
    page,
  }) => {
    await page.goto("/zh-CN/product-boundary");
    await expect(page.getByRole("link", { name: "English" })).toBeVisible();

    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/product-boundary$/);
    await expect(
      page.getByRole("heading", { name: "Product boundary" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "\u4e2d\u6587" }).click();
    await expect(page).toHaveURL(/\/zh-CN\/product-boundary$/);
  });

  test("serves the English login page", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "\u4e2d\u6587" }),
    ).toBeVisible();
  });
});
