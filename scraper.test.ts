import { assertEquals } from "jsr:@std/assert";

Deno.test("Scraped data must include corrected entries", async () => {
  const files = [];
  for await (const entry of Deno.readDir("data")) {
    if (entry.name.startsWith("scrape-") && entry.name.endsWith(".json")) {
      files.push(entry.name);
    }
  }

  if (files.length === 0) {
    throw new Error("No scraped data found. Run `make scrape` first.");
  }

  files.sort();
  const latestFile = files[files.length - 1];
  const content = await Deno.readTextFile(`data/${latestFile}`);
  const entries = JSON.parse(content);

  assertEquals(entries.length, 1209);
});
