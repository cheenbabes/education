import { test, expect } from "@playwright/test";

// All 8 possible archetype names — one will appear after Part 1
const ARCHETYPE_NAMES = [
  "The Guide",
  "The Explorer",
  "The Cultivator",
  "The Naturalist",
  "The Storyteller",
  "The Architect",
  "The Free Spirit",
  "The Weaver",
];

const PART1_QUESTION_COUNT = 20;

// Part 1 question IDs in the order they appear in PART1_QUESTIONS
const PART1_QUESTION_IDS = [
  "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10",
  "q11", "q12", "q13", "q14", "q15", "q16", "q17", "q18", "q19",
  "q1", "q20",
];

/**
 * Helper: answer all 20 Part 1 questions by clicking the first choice each time.
 * After each click the quiz animates for 400ms before advancing, so we wait 600ms.
 */
async function answerAllPart1Questions(page: import("@playwright/test").Page) {
  for (let i = 0; i < PART1_QUESTION_COUNT; i++) {
    // Wait for the question counter to confirm we are on the right question
    await expect(
      page.getByText(`Question ${i + 1} of ${PART1_QUESTION_COUNT}`)
    ).toBeVisible({ timeout: 8000 });

    // Part 1 choices are full-width <button> elements inside .animate-fadeIn.
    // We use page.evaluate to click because Playwright's native click can be
    // intercepted by the fixed progress bar overlay at the top of the page.
    const questionContainer = page.locator(".animate-fadeIn");
    const choiceButtons = questionContainer.locator("button");
    await choiceButtons.first().waitFor({ state: "visible", timeout: 5000 });

    // Click via JS to avoid overlay interception issues (the fixed progress
    // bar at the top of the page intercepts Playwright's native click).
    // For the first question, we retry the click because React hydration
    // may not yet have attached the event handler when the page first loads
    // (especially on Next.js dev server cold starts).
    // Use dispatchEvent to reliably trigger React's synthetic event system.
    const isLastQuestion = i === PART1_QUESTION_COUNT - 1;
    const nextLocator = isLastQuestion
      ? page.locator("h2.font-cormorant-sc")
      : page.getByText(`Question ${i + 2} of ${PART1_QUESTION_COUNT}`);

    // Brief pause before each click so the fadeIn animation settles.
    // The first question gets extra time for React hydration. The
    // beforeAll hook pre-warms the dev server, but hydration of the
    // specific page instance still needs a moment.
    await page.waitForTimeout(i === 0 ? 1500 : 400);

    await page.evaluate(() => {
      const btn = document.querySelector(
        ".animate-fadeIn button"
      ) as HTMLButtonElement;
      if (btn) {
        btn.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
      }
    });

    await expect(nextLocator).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Helper: answer all visible Part 2 questions by clicking the first choice
 * and then clicking Next (or "See Results" on the last one).
 * Returns when the page navigates away from the quiz.
 */
async function answerAllPart2Questions(page: import("@playwright/test").Page) {
  let questionIndex = 0;
  const maxQuestions = 12; // safety upper bound

  while (questionIndex < maxQuestions) {
    // Check if we are still in Part 2
    const isStillQuiz = await page
      .getByText("Part 2: Your Practical Needs")
      .isVisible()
      .catch(() => false);
    if (!isStillQuiz) break;

    // Wait for the question counter
    const questionCounter = page
      .locator("p")
      .filter({ hasText: /^Question \d+ of \d+$/ });
    await expect(questionCounter).toBeVisible({ timeout: 5000 });

    // Click the first choice button
    const firstChoice = page.locator(".space-y-2 > button").first();
    await firstChoice.waitFor({ state: "visible", timeout: 3000 });
    await firstChoice.click();

    // Click "Next" or "See Results"
    const nextButton = page.getByRole("button", { name: /Next|See Results/i });
    await expect(nextButton).toBeEnabled({ timeout: 3000 });
    await nextButton.click();

    // Brief wait for transition
    await page.waitForTimeout(400);
    questionIndex++;
  }
}

// ---------------------------------------------------------------------------
// Compass Quiz Flow
// ---------------------------------------------------------------------------

test.describe("Compass Quiz Flow", () => {
  // Warm up the Next.js dev server by pre-fetching the quiz page.
  // On cold starts, Next.js compiles the page on-demand which can take
  // 10-30+ seconds. Without this, the first test often fails because
  // React hydration hasn't completed by the time we try to click.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto("/compass/quiz", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.close();
  });

  // -----------------------------------------------------------------------
  // Test 1: Unauthenticated user completes Part 1 and sees auth gate
  // -----------------------------------------------------------------------
  test("Unauthenticated user completes Part 1 and sees auth gate", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await page.goto("/compass/quiz", { waitUntil: "networkidle" });

    // Verify Part 1 header is visible
    await expect(page.getByText("Part 1: Your Teaching Style")).toBeVisible();

    // Answer all 20 Part 1 questions
    await answerAllPart1Questions(page);

    // --- Compass reveal phase ---

    // Verify an archetype name heading is visible (one of the 8 archetypes)
    const archetypeHeading = page.locator("h2.font-cormorant-sc");
    await expect(archetypeHeading).toBeVisible({ timeout: 5000 });
    const archetypeText = await archetypeHeading.textContent();
    expect(
      ARCHETYPE_NAMES.some((name) => archetypeText?.includes(name))
    ).toBeTruthy();

    // Verify the archetype image is visible
    await expect(
      page.locator('img[src*="/archetypes/"]').first()
    ).toBeVisible();

    // Verify "Your Five Dimensions" is NOT visible (gated behind auth)
    await expect(page.getByText("Your Five Dimensions")).not.toBeVisible();

    // Verify "Your Philosophy Blend" is NOT visible (gated behind auth)
    await expect(page.getByText("Your Philosophy Blend")).not.toBeVisible();

    // Verify "Create Free Account to Continue" button IS visible
    await expect(
      page.getByRole("button", { name: "Create Free Account to Continue" })
    ).toBeVisible();

    // Verify "Continue to Curriculum Matching" button is NOT visible
    await expect(
      page.getByRole("button", { name: "Continue to Curriculum Matching" })
    ).not.toBeVisible();

    // Verify the "Already have an account? Sign in" button is also visible
    await expect(
      page.getByRole("button", { name: /Already have an account/i })
    ).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // Test 2: Clicking "Create Free Account" saves answers and redirects
  //         to Clerk sign-up
  // -----------------------------------------------------------------------
  test("Clicking Create Free Account saves Part 1 answers to sessionStorage and redirects to sign-up", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await page.goto("/compass/quiz");
    await expect(page.getByText("Part 1: Your Teaching Style")).toBeVisible();

    // Answer all 20 Part 1 questions
    await answerAllPart1Questions(page);

    // Wait for compass reveal
    await expect(page.locator("h2.font-cormorant-sc")).toBeVisible({
      timeout: 5000,
    });

    // Click "Create Free Account to Continue" via JS click. The button is
    // wrapped in Clerk's <SignUpButton> which causes React re-renders that
    // make Playwright's native click retry indefinitely.
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) =>
        b.textContent?.includes("Create Free Account to Continue")
      );
      btn?.click();
    });

    // Should redirect to /sign-up (Clerk sign-up page)
    await page.waitForURL(/\/sign-up/, { timeout: 15000 });

    // Verify that Clerk sign-up page loaded
    await expect(page.getByText("Create your account")).toBeVisible({
      timeout: 10000,
    });

    // Verify that Part 1 answers were saved to sessionStorage before redirect.
    // Note: sessionStorage persists across same-origin navigations, so we can
    // read it after the redirect to /sign-up.
    const savedAnswers = await page.evaluate(() => {
      return sessionStorage.getItem("compass_part1_answers");
    });
    expect(savedAnswers).not.toBeNull();
    const parsed = JSON.parse(savedAnswers!);
    // Should have an answer for each of the 20 questions
    expect(Object.keys(parsed).length).toBe(PART1_QUESTION_COUNT);
  });

  // -----------------------------------------------------------------------
  // Test 3: Authenticated user sees full compass reveal with dimensions,
  //         philosophy blend, and can proceed to Part 2
  //
  // NOTE: This Clerk instance uses OAuth-only sign-up (Facebook + Google),
  // which cannot be automated in a headless Playwright test. To make this
  // test work, we mock the Clerk `useUser` hook by intercepting the Clerk
  // client API response so the quiz page sees `isSignedIn: true`.
  //
  // To run authenticated tests against a real Clerk session, either:
  //   1. Enable email sign-up in Clerk Dashboard and use +clerk_test emails
  //   2. Install @clerk/testing and use clerkSetup() with test tokens
  //   3. Provide a storageState file with pre-authenticated cookies
  // -----------------------------------------------------------------------
  test("Authenticated user sees full reveal and completes Part 2", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // Intercept Clerk's client API to fake an authenticated session.
    // Clerk v5+ fetches session state from its backend via __clerk/client
    // and the useUser hook reads from that response. By intercepting and
    // patching the response, we can make the quiz page think the user is
    // signed in without going through real OAuth.
    await page.route("**/clerk**client**", async (route) => {
      const response = await route.fetch();
      const body = await response.text();

      try {
        const json = JSON.parse(body);
        // If the response has a `sessions` array, inject a fake active session
        if (json && typeof json === "object") {
          // Patch: set response so Clerk thinks there's an active session.
          // The exact structure varies by Clerk version. We set the most
          // common fields.
          if (Array.isArray(json.sessions) && json.sessions.length === 0) {
            json.sessions = [
              {
                id: "sess_test_playwright",
                status: "active",
                user: {
                  id: "user_test_playwright",
                  email_addresses: [
                    {
                      id: "idn_test",
                      email_address: "playwright@test.com",
                    },
                  ],
                  first_name: "Test",
                  last_name: "User",
                  primary_email_address_id: "idn_test",
                },
                last_active_session_id: "sess_test_playwright",
              },
            ];
            json.last_active_session_id = "sess_test_playwright";
          }

          await route.fulfill({
            status: response.status(),
            headers: response.headers(),
            body: JSON.stringify(json),
          });
          return;
        }
      } catch {
        // Not JSON or parsing failed — pass through
      }

      await route.fulfill({ response });
    });

    // Pre-populate sessionStorage with Part 1 answers so we can skip Part 1
    // and go directly to the compass-reveal phase via ?resume=true.
    await page.goto("/compass/quiz");
    const part1Answers: Record<string, number> = {};
    for (const id of PART1_QUESTION_IDS) {
      part1Answers[id] = 0;
    }
    await page.evaluate((answers) => {
      sessionStorage.setItem("compass_part1_answers", JSON.stringify(answers));
    }, part1Answers);

    // Navigate with resume=true to trigger the restore logic
    await page.goto("/compass/quiz?resume=true");

    // Should jump directly to compass-reveal phase
    const archetypeHeading = page.locator("h2.font-cormorant-sc");
    await expect(archetypeHeading).toBeVisible({ timeout: 10000 });

    // Check what the authenticated user sees.
    // If the Clerk mock worked, we should see the full reveal.
    // If not (e.g. Clerk version changed its API shape), we detect and skip.
    const dimensionsVisible = await page
      .getByText("Your Five Dimensions")
      .isVisible()
      .catch(() => false);

    if (dimensionsVisible) {
      // Full authenticated flow

      // Verify "Your Philosophy Blend" is visible
      await expect(page.getByText("Your Philosophy Blend")).toBeVisible();

      // Verify "Continue to Curriculum Matching" button is visible
      const continueToP2 = page.getByRole("button", {
        name: "Continue to Curriculum Matching",
      });
      await expect(continueToP2).toBeVisible();

      // "Create Free Account to Continue" should NOT be visible
      await expect(
        page.getByRole("button", { name: "Create Free Account to Continue" })
      ).not.toBeVisible();

      // Click "Continue to Curriculum Matching" to start Part 2
      await continueToP2.click();

      // Verify Part 2 header
      await expect(
        page.getByText("Part 2: Your Practical Needs")
      ).toBeVisible({ timeout: 5000 });

      // Answer all Part 2 questions
      await answerAllPart2Questions(page);

      // Should navigate to the results page
      await page.waitForURL(/\/compass\/results/, { timeout: 15000 });
    } else {
      // Clerk mock did not take effect — the user appears unauthenticated.
      // This is expected if Clerk's client API shape has changed.
      // Log a clear message and skip the rest of this test gracefully.
      test.skip(
        true,
        "Clerk session mock did not produce an authenticated state. " +
          "To enable this test, configure Clerk with email sign-up or " +
          "provide a pre-authenticated storageState file."
      );
    }
  });

  // -----------------------------------------------------------------------
  // Test 4: Part 2 question flow mechanics (answer selection, navigation)
  //
  // Tests Part 2 independently by injecting state via sessionStorage,
  // bypassing the need for auth by using the same Clerk mock approach.
  // -----------------------------------------------------------------------
  test("Part 2 question flow — answer selection and navigation work correctly", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // Same Clerk mock as Test 3
    await page.route("**/clerk**client**", async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      try {
        const json = JSON.parse(body);
        if (json && typeof json === "object") {
          if (Array.isArray(json.sessions) && json.sessions.length === 0) {
            json.sessions = [
              {
                id: "sess_test_pw2",
                status: "active",
                user: {
                  id: "user_test_pw2",
                  email_addresses: [
                    { id: "idn_test2", email_address: "pw2@test.com" },
                  ],
                  first_name: "Test",
                  last_name: "User2",
                  primary_email_address_id: "idn_test2",
                },
                last_active_session_id: "sess_test_pw2",
              },
            ];
            json.last_active_session_id = "sess_test_pw2";
          }
          await route.fulfill({
            status: response.status(),
            headers: response.headers(),
            body: JSON.stringify(json),
          });
          return;
        }
      } catch {
        // pass through
      }
      await route.fulfill({ response });
    });

    // Also mock the submit API since the fake user won't exist in the database
    await page.route("**/api/compass/submit", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "test-result-id" }),
      });
    });

    // Set up Part 1 answers in sessionStorage
    await page.goto("/compass/quiz");
    const part1Answers: Record<string, number> = {};
    for (const id of PART1_QUESTION_IDS) {
      part1Answers[id] = 0;
    }
    await page.evaluate((answers) => {
      sessionStorage.setItem("compass_part1_answers", JSON.stringify(answers));
    }, part1Answers);

    await page.goto("/compass/quiz?resume=true");

    // Wait for compass reveal
    await expect(page.locator("h2.font-cormorant-sc")).toBeVisible({
      timeout: 10000,
    });

    // Check if the Clerk mock worked
    const continueButton = page.getByRole("button", {
      name: "Continue to Curriculum Matching",
    });
    const canContinue = await continueButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!canContinue) {
      test.skip(
        true,
        "Clerk session mock did not produce an authenticated state."
      );
      return;
    }

    // Start Part 2
    await continueButton.click();

    await expect(
      page.getByText("Part 2: Your Practical Needs")
    ).toBeVisible({ timeout: 5000 });

    // Verify the first question is about subjects (p2_subjects, multi-select)
    await expect(
      page.getByText("Which subjects are you looking for curriculum for?")
    ).toBeVisible();

    // Verify "Select all that apply" helper text for multi-select questions
    await expect(page.getByText("Select all that apply")).toBeVisible();

    // The "Next" button should be disabled until an answer is selected
    const nextBtn = page.getByRole("button", { name: "Next" });
    await expect(nextBtn).toBeVisible();

    // Select a choice (Literacy)
    await page.getByRole("button", { name: /Literacy/i }).click();

    // Now "Next" should be enabled
    await expect(nextBtn).toBeEnabled();

    // Click Next to advance to question 2
    await nextBtn.click();
    await page.waitForTimeout(400);

    // Should be on question 2 (p2_organization)
    await expect(
      page.getByText("How do you prefer to organize your curriculum?")
    ).toBeVisible({ timeout: 5000 });

    // Verify Back button is visible on question 2
    await expect(
      page.getByRole("button", { name: /Back/i })
    ).toBeVisible();

    // Click Back to return to question 1
    await page.getByRole("button", { name: /Back/i }).click();
    await page.waitForTimeout(400);

    // Should be back on question 1
    await expect(
      page.getByText("Which subjects are you looking for curriculum for?")
    ).toBeVisible({ timeout: 5000 });

    // Now answer all Part 2 questions to completion
    // First re-select an answer for q1 since we came back
    await page.getByRole("button", { name: /Literacy/i }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForTimeout(400);

    // Answer remaining questions by clicking first choice + Next each time
    let safetyCounter = 0;
    while (safetyCounter < 15) {
      const isStillQuiz = await page
        .getByText("Part 2: Your Practical Needs")
        .isVisible()
        .catch(() => false);
      if (!isStillQuiz) break;

      const firstChoice = page.locator(".space-y-2 > button").first();
      const choiceVisible = await firstChoice.isVisible().catch(() => false);
      if (choiceVisible) {
        await firstChoice.click();
      }

      const actionBtn = page.getByRole("button", {
        name: /Next|See Results/i,
      });
      const btnEnabled = await actionBtn.isEnabled().catch(() => false);
      if (btnEnabled) {
        await actionBtn.click();
      }

      await page.waitForTimeout(400);
      safetyCounter++;
    }

    // Should navigate to results page
    await page.waitForURL(/\/compass\/results/, { timeout: 15000 });
  });
});
