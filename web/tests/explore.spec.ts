import { test, expect, chromium } from "@playwright/test";

const EXPLORE_URL = "http://localhost:3456/explore";
const MOCK_GRAPH = {
  philosophies: [
    {
      name: "montessori-inspired",
      description: "Hands-on learner-led approach.",
      color: "#8B5CF6",
      dimensions: { structure: 35, modality: 30 },
      principleCount: 10,
      activityCount: 10,
      materialCount: 10,
    },
    {
      name: "waldorf-adjacent",
      description: "Creative and rhythm-forward learning.",
      color: "#F59E0B",
      dimensions: { structure: 45, modality: 25 },
      principleCount: 8,
      activityCount: 8,
      materialCount: 8,
    },
  ],
  curricula: [
    {
      id: "c1",
      name: "Moving Beyond the Page",
      publisher: "MBTP",
      description: "Integrated curriculum.",
      subjects: ["literacy"],
      gradeRange: "K-8",
      philosophyScores: {
        montessori: 0.65,
        waldorf: 0.2,
        classical: 0.15,
      },
      prepLevel: "print",
      religiousType: "secular",
      priceRange: "$500-$700/year",
      qualityScore: 0.86,
      affiliateUrl: null,
      notes: "Mocked record",
    },
  ],
  principles: [
    {
      id: "p1",
      name: "Self-directed discovery",
      description: "Children choose sequence.",
      philosophyId: "montessori-inspired",
    },
  ],
  activities: [
    {
      id: "a1",
      name: "Practical life work",
      description: "Daily living skills.",
      indoorOutdoor: "both",
      philosophyId: "montessori-inspired",
    },
  ],
  materials: [
    {
      id: "m1",
      name: "Wooden manipulatives",
      category: "manipulatives",
      philosophyId: "montessori-inspired",
    },
  ],
  dataIntegrity: {
    missingPhilosophies: [
      "classical",
      "charlotte-mason",
      "project-based-learning",
      "place-nature-based",
      "unschooling",
      "flexible",
    ],
  },
};

async function mockGraph(page: import("@playwright/test").Page) {
  await page.route("**/api/explore/graph", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_GRAPH),
    });
  });
}

test.describe("Explore atlas", () => {
  test("loads core controls and canvas", async () => {
    const browser = await chromium.launch({
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await mockGraph(page);

    await page.goto(EXPLORE_URL);
    await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("watercolor-bg")).toBeVisible();
    await expect(page.getByTestId("watercolor-bg")).toHaveCSS(
      "background-image",
      /watercolor-bg-teal\.png/,
    );

    await expect(page.getByLabel("Zoom in")).toBeVisible();
    await expect(page.getByLabel("Zoom out")).toBeVisible();
    await expect(page.getByLabel("Toggle search")).toBeVisible();
    await expect(page.getByLabel("Go home")).toBeVisible();

    await browser.close();
  });

  test("search and zoom interactions work", async () => {
    const browser = await chromium.launch({
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await mockGraph(page);

    await page.goto(EXPLORE_URL);
    await expect(page.locator("canvas")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("watercolor-bg")).toBeVisible();

    await page.getByLabel("Toggle search").click();
    const searchInput = page.locator('input[placeholder="Search curricula..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("montessori");
    await searchInput.press("Enter");

    await expect(page.getByText("Montessori Inspired")).toBeVisible({ timeout: 7000 });

    await page.getByLabel("Zoom in").click();
    await page.getByLabel("Zoom out").click();

    await browser.close();
  });

});
