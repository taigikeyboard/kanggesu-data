import { writeFileSync } from "node:fs";
import type { Entry } from "./types.ts";

const API_URL =
  "https://kanggesu.ntcri.org.tw/NTCRI_TaigiWebSite/api/EntriesBase/List";

const REQUEST_BODY = {
  mainType: ["A", "B", "C", "F", "G", "L", "M", "O", "P", "S", "W"],
  childType: [1, 2, 3, 4, 5, 6, 7],
  keyword: "",
  page: { current: 1, per: 100, orderBy: "CreateTime", orderByAsc: true },
  relatedpage: { current: 1, per: 3, orderBy: "", orderByAsc: true },
};

interface ApiResponse {
  list: Entry[];
  page: {
    count: number;
    rows: number;
  };
}

async function fetchPage(page: number): Promise<ApiResponse> {
  const body = {
    ...REQUEST_BODY,
    page: { ...REQUEST_BODY.page, current: page },
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "kanggesu-data scraper",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

async function scrapeAll(): Promise<Entry[]> {
  const firstPage = await fetchPage(1);
  const totalPages = firstPage.page.count;

  console.log(`Total pages: ${totalPages}`);

  const entriesMap = new Map<string, Entry>();

  for (const entry of firstPage.list) {
    entriesMap.set(entry.entriesBaseId, entry);
  }
  console.log(`Scraped page 1/${totalPages}`);

  for (let page = 2; page <= totalPages; page++) {
    const data = await fetchPage(page);
    for (const entry of data.list) {
      entriesMap.set(entry.entriesBaseId, entry);
    }
    console.log(`Scraped page ${page}/${totalPages}`);
  }

  return Array.from(entriesMap.values());
}

const entries = await scrapeAll();

entries.sort((a, b) => a.entriesBaseId.localeCompare(b.entriesBaseId));

console.log(`Done, there are ${entries.length} unique entries`);

const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
writeFileSync(`data/scrape-${today}.json`, JSON.stringify(entries, null, 1));

console.log(`Saved to data/scrape-${today}.json`);
