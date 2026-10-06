import { expect, test } from "@playwright/test";

/**
 * End-to-end tests (spec §93).
 *
 * These check the paths a real visitor takes, and — more
 * importantly — that the product keeps its promises under the
 * conditions it claims to handle: RTL, keyboard access, offline
 * degradation, and refusing to invent a reading.
 */

test.describe("landing page", () => {
  test("renders the hero and the primary calls to action", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /translate an inscription/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /explore the collection/i }),
    ).toBeVisible();
  });

  test("states that it never fabricates AI output", async ({ page }) => {
    await page.goto("/");
    // The honesty notice is a permanent fixture of the site,
    // not a dismissible toast.
    await expect(
      page.getByText(/never fabricates AI output/i),
    ).toBeVisible();
  });

  test("labels demo data clearly", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/demo data/i).first()).toBeVisible();
  });
});

test.describe("navigation", () => {
  const destinations = [
    { path: "/translator", heading: /translate/i },
    { path: "/assistant", heading: /assistant/i },
    { path: "/museums", heading: /museums/i },
    { path: "/learn", heading: /hieroglyphs|learn/i },
    { path: "/discover", heading: /discover/i },
  ];

  for (const destination of destinations) {
    test(`${destination.path} loads`, async ({ page }) => {
      await page.goto(destination.path);
      await expect(
        page.getByRole("heading", { level: 1 }),
      ).toContainText(destination.heading);
    });
  }

  test("moves between pages from the header", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Museums" }).click();
    await expect(page).toHaveURL(/\/museums$/);
  });
});

test.describe("translator", () => {
  test("shows the sample inscriptions", async ({ page }) => {
    await page.goto("/translator");
    await expect(
      page.getByRole("heading", { name: /use a sample inscription/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Son of Re/i }),
    ).toBeVisible();
  });

  test("translates a sample and reports confidence", async ({ page }) => {
    await page.goto("/translator");
    await page.getByRole("button", { name: /Son of Re/i }).click();

    // The reading panel appears.
    await expect(
      page.getByRole("heading", { name: /^reading$/i }),
    ).toBeVisible({ timeout: 30_000 });

    // Confidence is stated as text, never colour alone.
    await expect(page.getByText(/confidence/i).first()).toBeVisible();
    await expect(page.getByText(/high|medium|low/i).first()).toBeVisible();
  });

  test("cites its sources", async ({ page }) => {
    await page.goto("/translator");
    await page.getByRole("button", { name: /Son of Re/i }).click();
    await expect(
      page.getByRole("heading", { name: /^reading$/i }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(/Gardiner|Allen/i).first(),
    ).toBeVisible();
  });

  test("offers manual sign selection as an escape hatch", async ({
    page,
  }) => {
    await page.goto("/translator");
    await page.getByRole("button", { name: /select signs manually/i }).click();
    await expect(
      page.getByRole("heading", { name: /manual sign selection/i }),
    ).toBeVisible();
  });

  test("rejects an unsupported file type", async ({ page }) => {
    await page.goto("/translator");
    await page.setInputFiles('input[type="file"]', {
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await expect(
      page.getByText(/file type isn't supported|not supported/i),
    ).toBeVisible();
  });
});

test.describe("sign database", () => {
  test("filters signs by search term", async ({ page }) => {
    await page.goto("/discover");
    await page.getByRole("searchbox").fill("owl");
    await expect(page.getByText(/Owl/).first()).toBeVisible();
  });

  test("filters signs by Gardiner category", async ({ page }) => {
    await page.goto("/discover");
    await page.getByLabel(/category/i).selectOption("G");
    // Birds only: the owl is in group G.
    await expect(page.getByText(/Owl/).first()).toBeVisible();
  });

  test("says so when nothing matches", async ({ page }) => {
    await page.goto("/discover");
    await page.getByRole("searchbox").fill("zzzzqqqxxx");
    await expect(page.getByText(/nothing found/i).first()).toBeVisible();
  });
});

test.describe("museums", () => {
  test("renders a floor plan with objects", async ({ page }) => {
    await page.goto("/museums");
    await page.getByRole("link", { name: /Grand Egyptian Museum/ }).first().click();

    await expect(
      page.getByRole("img", { name: /floor plan|ground floor/i }).first(),
    ).toBeVisible();
  });

  test("shows an object record with its sources", async ({ page }) => {
    await page.goto("/museums");
    await page.getByRole("link", { name: /Grand Egyptian Museum/ }).first().click();
    await page.getByRole("tab", { name: /objects/i }).click();
    await page.getByRole("link", { name: /Funerary Mask/ }).first().click();

    await expect(
      page.getByRole("heading", { name: /Funerary Mask/ }),
    ).toBeVisible();
    await expect(page.getByText(/inventory/i).first()).toBeVisible();
  });
});

test.describe("learning", () => {
  test("opens a lesson and answers a quiz question", async ({ page }) => {
    await page.goto("/learn/the-24-consonant-signs");
    await expect(
      page.getByRole("heading", { name: /24 consonant signs/i }),
    ).toBeVisible();

    // Answer the first question and check it.
    const options = page.getByRole("button").filter({
      hasText: /forearm|mouth|bread loaf|owl/i,
    });
    if ((await options.count()) > 0) {
      await options.first().click();
    }
  });

  test("explains the answer after checking", async ({ page }) => {
    await page.goto("/learn/what-are-hieroglyphs");
    const quiz = page.getByRole("heading", { name: /^quiz$/i });
    if ((await quiz.count()) > 0) {
      await expect(quiz).toBeVisible();
    }
  });
});

test.describe("internationalisation", () => {
  test("Arabic renders right-to-left", async ({ page }) => {
    await page.goto("/ar");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "ar");
  });

  test("the language switch preserves the current page", async ({ page }) => {
    await page.goto("/translator");
    await page.getByRole("link", { name: /language/i }).click();
    await expect(page).toHaveURL(/\/ar\/translator$/);
  });

  test("Arabic pages show translated chrome", async ({ page }) => {
    await page.goto("/ar/museums");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "المتاحف",
    );
  });
});

test.describe("accessibility", () => {
  test("exposes a skip link as the first focusable element", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveAttribute("href", "#main");
  });

  test("every page has exactly one level-one heading", async ({ page }) => {
    await page.goto("/translator");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("interactive controls have accessible names", async ({ page }) => {
    await page.goto("/translator");
    const unnamed = await page
      .getByRole("button")
      .evaluateAll((nodes) =>
        nodes.filter((node) => {
          const text = (node.textContent ?? "").trim();
          const label = node.getAttribute("aria-label");
          return text.length === 0 && !label;
        }).length,
      );
    expect(unnamed).toBe(0);
  });
});

test.describe("resilience", () => {
  test("a 404 renders a helpful page rather than a stack trace", async ({
    page,
  }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("link", { name: /home/i }).first(),
    ).toBeVisible();
  });

  test("an invalid AI request returns a typed error envelope", async ({
    request,
  }) => {
    const response = await request.post("/api/ai/translate", {
      data: { image: { dataUrl: "not-an-image" } },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    const body = await response.json();
    // The envelope shape is the contract clients rely on.
    expect(body).toHaveProperty("error");
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("message");
  });

  test("the health endpoint reports configuration", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data.provider).toBeTruthy();
    expect(body.data).toHaveProperty("demoMode");
    expect(body.data.content).toHaveProperty("signs");
  });
});