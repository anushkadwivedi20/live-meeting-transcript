import { expect, test } from "@playwright/test";

test("loads a long transcript, searches it, and accepts an action item", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Transcript viewer" })).toBeVisible();

  await page.getByRole("button", { name: "Load 10,000 lines" }).click();
  await expect(page.getByText("10,000 lines")).toBeVisible();

  await page.getByLabel("Search transcript").fill("checklist");
  await expect(page.getByText(/\d+ matches/)).toBeVisible();
  await expect(page.getByLabel("Transcript captions")).toContainText("checklist");

  await page.getByRole("button", { name: "Generate action items" }).click();
  const accept = page.getByRole("button", { name: "Accept" }).first();
  await expect(accept).toBeVisible();
  await accept.click();
  await expect(page.getByRole("button", { name: "Accepted" }).first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
