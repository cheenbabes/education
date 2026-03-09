import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

test.describe("Navigation", () => {
  test("landing page loads and has Get Started link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("EduApp")).toBeVisible();
    await expect(page.getByText("Get Started")).toBeVisible();
  });

  test("nav bar links work", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.getByRole("link", { name: "Children" }).click();
    await expect(page.getByRole("heading", { name: /Children/i })).toBeVisible();

    await page.getByRole("link", { name: "Generate Lesson" }).click();
    await expect(page.getByRole("heading", { name: "Generate a Lesson" })).toBeVisible();

    await page.getByRole("link", { name: "Calendar" }).click();
    await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();

    await page.getByRole("link", { name: "Lessons" }).click();
    await expect(page.getByRole("heading", { name: /Lessons/i })).toBeVisible();

    await page.getByRole("link", { name: "Standards" }).click();
    await expect(page.getByRole("heading", { name: /Standards/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

test.describe("Dashboard", () => {
  test("shows children from database", async ({ page }) => {
    await page.goto("/dashboard");
    // Wait for loading to finish
    await page.waitForSelector("text=Emma", { timeout: 10000 });
    await expect(page.getByText("Emma")).toBeVisible();
    await expect(page.getByText("Jack")).toBeVisible();
    await expect(page.getByText("Grade 2")).toBeVisible();
    await expect(page.getByText("Grade 4")).toBeVisible();
  });

  test("has generate lesson button", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Generate Lesson" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Children
// ---------------------------------------------------------------------------

test.describe("Children", () => {
  test("lists existing children", async ({ page }) => {
    await page.goto("/children");
    await page.waitForSelector("text=Emma", { timeout: 10000 });
    await expect(page.getByText("Emma")).toBeVisible();
    await expect(page.getByText("Jack")).toBeVisible();
  });

  test("can open add child form", async ({ page }) => {
    await page.goto("/children");
    await page.waitForSelector("text=Emma", { timeout: 10000 });
    await page.getByText("+ Add Child").click();
    await expect(page.getByRole("heading", { name: "Add Child" })).toBeVisible();
    await expect(page.getByPlaceholder(/name/i)).toBeVisible();
  });

  test("add child form has required fields", async ({ page }) => {
    await page.goto("/children");
    await page.waitForSelector("text=Emma", { timeout: 10000 });
    await page.getByText("+ Add Child").click();
    // Name, DOB, Grade, Standards toggle should be present
    await expect(page.getByPlaceholder(/name/i)).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Generate Lesson
// ---------------------------------------------------------------------------

test.describe("Generate Lesson", () => {
  test("shows child selection buttons from database", async ({ page }) => {
    await page.goto("/generate");
    await page.waitForSelector("text=Emma", { timeout: 10000 });
    await expect(page.getByText("Emma (Grade 2)")).toBeVisible();
    await expect(page.getByText("Jack (Grade 4)")).toBeVisible();
  });

  test("has interest text input", async ({ page }) => {
    await page.goto("/generate");
    const input = page.getByPlaceholder(/dinosaurs/i);
    await expect(input).toBeVisible();
    await input.fill("fire trucks");
    await expect(input).toHaveValue("fire trucks");
  });

  test("has subject buttons", async ({ page }) => {
    await page.goto("/generate");
    await expect(page.getByRole("button", { name: "Math" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Science" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Language Arts" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Social Studies" })).toBeVisible();
  });

  test("has philosophy radio options", async ({ page }) => {
    await page.goto("/generate");
    await expect(page.getByText("Flexible")).toBeVisible();
    await expect(page.getByText("Waldorf-Adjacent")).toBeVisible();
    await expect(page.getByText("Montessori-Inspired")).toBeVisible();
    await expect(page.getByText("Project-Based Learning")).toBeVisible();
    await expect(page.getByText("Place/Nature-Based")).toBeVisible();
  });

  test("Waldorf disclaimer shows when selected", async ({ page }) => {
    await page.goto("/generate");
    await page.getByText("Waldorf-Adjacent").click();
    await expect(page.getByText(/may not align exactly/i)).toBeVisible();
  });

  test("generate button disabled without selections", async ({ page }) => {
    await page.goto("/generate");
    const btn = page.getByRole("button", { name: "Generate Lesson" });
    await expect(btn).toBeDisabled();
  });

  test("generate button enabled with all selections", async ({ page }) => {
    await page.goto("/generate");
    await page.waitForSelector("text=Emma", { timeout: 10000 });

    // Select child
    await page.getByText("Emma (Grade 2)").click();
    // Type interest
    await page.getByPlaceholder(/dinosaurs/i).fill("volcanoes");
    // Select subject
    await page.getByRole("button", { name: "Science" }).click();

    const btn = page.getByRole("button", { name: "Generate Lesson" });
    await expect(btn).toBeEnabled();
  });

  test("multi-age shows message when two children selected", async ({ page }) => {
    await page.goto("/generate");
    await page.waitForSelector("text=Emma", { timeout: 10000 });
    await page.getByText("Emma (Grade 2)").click();
    await page.getByText("Jack (Grade 4)").click();
    await expect(page.getByText(/Multi-age lesson/i)).toBeVisible();
  });

  test("full generation flow works end-to-end", async ({ page }) => {
    test.setTimeout(90_000); // generation takes time

    await page.goto("/generate");
    await page.waitForSelector("text=Emma", { timeout: 10000 });

    // Select child
    await page.getByText("Emma (Grade 2)").click();
    // Type interest
    await page.getByPlaceholder(/dinosaurs/i).fill("butterflies");
    // Select subject
    await page.getByRole("button", { name: "Science" }).click();
    // Select philosophy
    await page.getByText("Place/Nature-Based").click();

    // Generate
    await page.getByRole("button", { name: "Generate Lesson" }).click();

    // Should show progress
    await expect(page.getByText(/Generating your lesson/i)).toBeVisible();
    await expect(page.getByText(/Looking up state standards/i)).toBeVisible();

    // Wait for result (up to 60 seconds for GPT-5.2)
    await page.waitForSelector("text=Print / PDF", { timeout: 60_000 });

    // Lesson should have key sections
    await expect(page.getByText(/Standards Addressed/i)).toBeVisible();
    await expect(page.getByText(/Materials Needed/i)).toBeVisible();
    await expect(page.getByText(/Lesson Plan/i)).toBeVisible();
    await expect(page.getByText(/Assessment/i)).toBeVisible();

    // Print button should be visible
    await expect(page.getByText("Print / PDF")).toBeVisible();

    // Generate another button should work
    await expect(page.getByText(/Generate another/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

test.describe("Calendar", () => {
  test("shows week and month view toggles", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.getByRole("button", { name: "Week" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Month" })).toBeVisible();
  });

  test("can switch between week and month view", async ({ page }) => {
    await page.goto("/calendar");
    await page.getByRole("button", { name: "Month" }).click();
    // Month view should show day name headers
    await expect(page.getByText("Sun", { exact: true })).toBeVisible();
    await expect(page.getByText("Tue", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Week" }).click();
    // Week view also shows day names
    await expect(page.getByText("Sun", { exact: true })).toBeVisible();
  });

  test("has navigation buttons", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.getByText("Previous")).toBeVisible();
    await expect(page.getByText("Next")).toBeVisible();
  });

  test("has generate new lesson button", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.getByRole("link", { name: /Generate New Lesson/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Lessons List
// ---------------------------------------------------------------------------

test.describe("Lessons List", () => {
  test("has filter buttons", async ({ page }) => {
    await page.goto("/lessons");
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pending" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();
  });

  test("has child filter dropdown", async ({ page }) => {
    await page.goto("/lessons");
    await expect(page.locator("select")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Standards Tracker
// ---------------------------------------------------------------------------

test.describe("Standards Tracker", () => {
  test("shows child selector", async ({ page }) => {
    await page.goto("/standards");
    await expect(page.getByRole("heading", { name: /Standards/i })).toBeVisible();
    await expect(page.locator("select")).toBeVisible();
  });
});
