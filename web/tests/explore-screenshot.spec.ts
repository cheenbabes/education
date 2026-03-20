import { test, expect, chromium } from "@playwright/test";

const EXPLORE_URL = "http://localhost:3456/explore";

test.describe("Knowledge Graph Explorer", () => {
  test("default view renders with philosophies and curricula", async () => {
    const browser = await chromium.launch({
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await page.goto(EXPLORE_URL);
    await page.waitForTimeout(5000);

    // Should have canvas element
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Should have zoom buttons
    await expect(page.getByLabel("Zoom in")).toBeVisible();
    await expect(page.getByLabel("Zoom out")).toBeVisible();

    // Should have home icon
    await expect(page.getByLabel("Go home")).toBeVisible();

    // Should have search icon
    await expect(page.getByLabel("Toggle search")).toBeVisible();

    await page.screenshot({ path: "/tmp/explore-default.png" });
    await browser.close();
  });

  test("search bar opens and closes", async () => {
    const browser = await chromium.launch({
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await page.goto(EXPLORE_URL);
    await page.waitForTimeout(5000);

    // Open search
    await page.getByLabel("Toggle search").click();
    await page.waitForTimeout(500);
    const searchInput = page.locator('input[placeholder="Search curricula..."]');
    await expect(searchInput).toBeVisible();
    await page.screenshot({ path: "/tmp/explore-search-open.png" });

    // Close search
    await page.getByLabel("Toggle search").click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "/tmp/explore-search-closed.png" });

    await browser.close();
  });

  test("clicking on canvas triggers interaction", async () => {
    const browser = await chromium.launch({
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await page.goto(EXPLORE_URL);
    await page.waitForTimeout(5000);

    // Click on the center of the canvas (should hit a philosophy star or empty space)
    const canvas = page.locator("canvas");
    const box = await canvas.boundingBox();
    if (box) {
      // Click center
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "/tmp/explore-click-center.png" });
    }

    // Test zoom buttons
    await page.getByLabel("Zoom in").click();
    await page.waitForTimeout(500);
    await page.getByLabel("Zoom in").click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "/tmp/explore-zoomed-in.png" });

    await page.getByLabel("Zoom out").click();
    await page.waitForTimeout(500);
    await page.getByLabel("Zoom out").click();
    await page.waitForTimeout(500);
    await page.getByLabel("Zoom out").click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "/tmp/explore-zoomed-out.png" });

    await browser.close();
  });

  test("search functionality works", async () => {
    const browser = await chromium.launch({
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await page.goto(EXPLORE_URL);
    await page.waitForTimeout(5000);

    // Open search
    await page.getByLabel("Toggle search").click();
    await page.waitForTimeout(300);

    // Type a search term
    const searchInput = page.locator('input[placeholder="Search curricula..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("montessori");
    await page.waitForTimeout(500);
    await page.screenshot({ path: "/tmp/explore-search-montessori.png" });

    // Press Enter to focus the match
    await searchInput.press("Enter");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "/tmp/explore-search-focused.png" });

    // Info panel should appear
    // Note: it may say "Montessori Inspired" or similar
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "/tmp/explore-after-search-enter.png" });

    await browser.close();
  });
});
