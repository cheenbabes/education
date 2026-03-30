import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

test.describe("Navigation", () => {
  test("landing page loads and has Compass Quiz CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("The Sage's Compass").first()).toBeVisible();
    await expect(page.getByText(/Take the Compass Quiz/i).first()).toBeVisible();
  });

  test("nav bar links work", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.getByRole("link", { name: "Children" }).click();
    await expect(page.getByRole("heading", { name: /Children/i })).toBeVisible();

    await page.getByRole("link", { name: "Create" }).click();
    await expect(page.getByRole("heading", { name: "Create a Lesson" })).toBeVisible();

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

  test("has create lesson button", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Create Lesson" })).toBeVisible();
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
// Create Lesson
// ---------------------------------------------------------------------------

test.describe("Create Lesson", () => {
  test("shows child selection buttons from database", async ({ page }) => {
    await page.goto("/create");
    await page.waitForSelector("text=Emma", { timeout: 10000 });
    await expect(page.getByText("Emma (Grade 2)")).toBeVisible();
    await expect(page.getByText("Jack (Grade 4)")).toBeVisible();
  });

  test("has interest text input", async ({ page }) => {
    await page.goto("/create");
    const input = page.getByPlaceholder(/dinosaurs/i);
    await expect(input).toBeVisible();
    await input.fill("fire trucks");
    await expect(input).toHaveValue("fire trucks");
  });

  test("has subject buttons", async ({ page }) => {
    await page.goto("/create");
    await expect(page.getByRole("button", { name: "Math" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Science" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Language Arts" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Social Studies" })).toBeVisible();
  });

  test("has philosophy radio options", async ({ page }) => {
    await page.goto("/create");
    await expect(page.getByText("Adaptive")).toBeVisible();
    await expect(page.getByText("Waldorf-Inspired")).toBeVisible();
    await expect(page.getByText("Montessori-Inspired")).toBeVisible();
    await expect(page.getByText("Project-Based Learning")).toBeVisible();
    await expect(page.getByText("Place/Nature-Based")).toBeVisible();
  });

  test("Waldorf disclaimer shows when selected", async ({ page }) => {
    await page.goto("/create");
    await page.getByText("Waldorf-Inspired").click();
    await expect(page.getByText(/may not align exactly/i)).toBeVisible();
  });

  test("generate button disabled without selections", async ({ page }) => {
    await page.goto("/create");
    const btn = page.getByRole("button", { name: "Create Lesson" });
    await expect(btn).toBeDisabled();
  });

  test("generate button enabled with all selections", async ({ page }) => {
    await page.goto("/create");
    await page.waitForSelector("text=Emma", { timeout: 10000 });

    // Select child
    await page.getByText("Emma (Grade 2)").click();
    // Type interest
    await page.getByPlaceholder(/dinosaurs/i).fill("volcanoes");
    // Select subject
    await page.getByRole("button", { name: "Science" }).click();

    const btn = page.getByRole("button", { name: "Create Lesson" });
    await expect(btn).toBeEnabled();
  });

  test("multi-age shows message when two children selected", async ({ page }) => {
    await page.goto("/create");
    await page.waitForSelector("text=Emma", { timeout: 10000 });
    await page.getByText("Emma (Grade 2)").click();
    await page.getByText("Jack (Grade 4)").click();
    await expect(page.getByText(/Multi-age lesson/i)).toBeVisible();
  });

  test("full generation flow works end-to-end", async ({ page }) => {
    test.setTimeout(90_000); // generation takes time

    await page.goto("/create");
    await page.waitForSelector("text=Emma", { timeout: 10000 });

    // Select child
    await page.getByText("Emma (Grade 2)").click();
    // Type interest
    await page.getByPlaceholder(/dinosaurs/i).fill("butterflies");
    // Select subject
    await page.getByRole("button", { name: "Science" }).click();
    // Select philosophy
    await page.getByText("Place/Nature-Based").click();

    // Create
    await page.getByRole("button", { name: "Create Lesson" }).click();

    // Should show progress
    await expect(page.getByText(/Creating your lesson/i)).toBeVisible();
    await expect(page.getByText(/Looking up state standards/i)).toBeVisible();

    // Should redirect to lesson detail page (up to 90 seconds for generation + save)
    await page.waitForURL(/\/lessons\//, { timeout: 90_000 });

    // Lesson detail page should have key sections
    await expect(page.getByText(/Standards Addressed/i)).toBeVisible();
    await expect(page.getByText(/Materials Needed/i)).toBeVisible();
    await expect(page.getByText(/Lesson Plan/i)).toBeVisible();

    // Print button should be visible
    await expect(page.getByText("Print / PDF")).toBeVisible();
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

  test("has create new lesson button", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.getByRole("link", { name: /Create New Lesson/i })).toBeVisible();
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
    await page.waitForSelector("h1", { timeout: 10000 });
    // Wait for lessons to load (selects appear after data loads)
    await page.waitForTimeout(2000);
    await expect(page.locator("select").first()).toBeVisible();
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
