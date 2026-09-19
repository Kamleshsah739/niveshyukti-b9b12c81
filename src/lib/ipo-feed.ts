import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { IpoRecord } from "@/lib/supabase/ipo";

type RuntimeEnv = Record<string, unknown>;

type IpoStatus = NonNullable<IpoRecord["status"]>;

type FeedSource = "financialmodelingprep" | "alphavantage" | "finnhub" | "chittorgarh-html";

type FeedRow = Omit<IpoRecord, "id">;

interface FeedSyncResult {
  synced: number;
  sources: FeedSource[];
}

interface FmpIpoItem {
  symbol?: string;
  company?: string;
  priceRange?: string;
  shares?: string | number;
  exchange?: string;
  actions?: string;
  date?: string;
}

interface AlphaVantageIpoItem {
  symbol?: string;
  name?: string;
  ipoDate?: string;
  priceRangeLow?: string | number;
  priceRangeHigh?: string | number;
  currency?: string;
  exchange?: string;
  totalSharesValue?: string | number;
  status?: string;
}

interface FinnhubIpoItem {
  name?: string;
  symbol?: string;
  date?: string;
  exchange?: string;
  numberOfShares?: string | number;
  price?: string | number;
  status?: string;
}

const SUPABASE_URL_KEYS = ["SUPABASE_URL", "VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;
const SUPABASE_ANON_KEYS = ["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
const SUPABASE_SERVICE_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_SECRET_KEY",
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_SERVICE_KEY",
  "VITE_SUPABASE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
] as const;
const IMPORT_META_ENV_MAP: Record<string, string | undefined> = {
  SUPABASE_URL: import.meta.env.SUPABASE_URL,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.SUPABASE_ANON_KEY,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SERVICE_KEY: import.meta.env.SUPABASE_SERVICE_KEY,
  SUPABASE_SECRET_KEY: import.meta.env.SUPABASE_SECRET_KEY,
  VITE_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  VITE_SUPABASE_SERVICE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_KEY,
  VITE_SUPABASE_SECRET_KEY: import.meta.env.VITE_SUPABASE_SECRET_KEY,
  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  IPO_SYNC_TOKEN: import.meta.env.IPO_SYNC_TOKEN,
  VITE_IPO_SYNC_TOKEN: import.meta.env.VITE_IPO_SYNC_TOKEN,
  FMP_API_KEY: import.meta.env.FMP_API_KEY,
  VITE_FMP_API_KEY: import.meta.env.VITE_FMP_API_KEY,
  ALPHA_VANTAGE_API_KEY: import.meta.env.ALPHA_VANTAGE_API_KEY,
  VITE_ALPHA_VANTAGE_API_KEY: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY,
  FINNHUB_API_KEY: import.meta.env.FINNHUB_API_KEY,
  VITE_FINNHUB_API_KEY: import.meta.env.VITE_FINNHUB_API_KEY,
};

export async function runIpoFeedSync(options: {
  runtime: RuntimeEnv;
  source: string;
  accessToken?: string;
}): Promise<FeedSyncResult> {
  const supabaseUrl = getFirstRuntimeString(options.runtime, SUPABASE_URL_KEYS);
  const serviceRoleKey = getFirstRuntimeString(options.runtime, SUPABASE_SERVICE_KEYS);
  const anonKey = getFirstRuntimeString(options.runtime, SUPABASE_ANON_KEYS);

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL runtime secret.");
  }

  let client: SupabaseClient;
  if (serviceRoleKey) {
    client = createClient(supabaseUrl, serviceRoleKey);
  } else if (anonKey && options.accessToken) {
    client = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
        },
      },
    });
  } else {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY runtime secret. For manual sync fallback, set SUPABASE_ANON_KEY and send a bearer token.");
  }

  const feeds = await fetchIpoFeeds(options.runtime);
  const synced = await upsertIpoRows(client, feeds.rows);

  await insertIpoSyncRun(client, {
    source: options.source,
    status: "success",
    synced_count: synced,
    error_message: null,
    ran_at: new Date().toISOString(),
  });

  return {
    synced,
    sources: feeds.sources,
  };
}

export async function logIpoFeedFailure(options: {
  runtime: RuntimeEnv;
  source: string;
  errorMessage: string;
  accessToken?: string;
}): Promise<void> {
  const supabaseUrl = getFirstRuntimeString(options.runtime, SUPABASE_URL_KEYS);
  const serviceRoleKey = getFirstRuntimeString(options.runtime, SUPABASE_SERVICE_KEYS);
  const anonKey = getFirstRuntimeString(options.runtime, SUPABASE_ANON_KEYS);

  if (!supabaseUrl) {
    return;
  }

  let client: SupabaseClient | null = null;
  if (serviceRoleKey) {
    client = createClient(supabaseUrl, serviceRoleKey);
  } else if (anonKey && options.accessToken) {
    client = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
        },
      },
    });
  }

  if (!client) {
    return;
  }

  await insertIpoSyncRun(client, {
    source: options.source,
    status: "failure",
    synced_count: 0,
    error_message: options.errorMessage,
    ran_at: new Date().toISOString(),
  });
}

async function fetchIpoFeeds(runtime: RuntimeEnv): Promise<{ rows: FeedRow[]; sources: FeedSource[] }> {
  const from = currentDate();
  const to = futureDate(180);

  const sources: FeedSource[] = [];
  const merged = new Map<string, FeedRow>();

  const fmpRows = await fetchFmpFeed(from, to, runtime);
  if (fmpRows.length > 0) {
    sources.push("financialmodelingprep");
    mergeRows(merged, fmpRows);
  }

  const alphaRows = await fetchAlphaVantageFeed(runtime);
  if (alphaRows.length > 0) {
    sources.push("alphavantage");
    mergeRows(merged, alphaRows);
  }

  const finnhubRows = await fetchFinnhubFeed(from, to, runtime);
  if (finnhubRows.length > 0) {
    sources.push("finnhub");
    mergeRows(merged, finnhubRows);
  }

  const htmlFallbackRows = await fetchChittorgarhHtmlFallbackFeed();
  if (htmlFallbackRows.length > 0) {
    sources.push("chittorgarh-html");
    mergeRows(merged, htmlFallbackRows);
  }

  return {
    rows: Array.from(merged.values()),
    sources,
  };
}

async function fetchFmpFeed(from: string, to: string, runtime: RuntimeEnv): Promise<FeedRow[]> {
  const apiKey = getRuntimeString(runtime, "FMP_API_KEY") ?? "demo";
  const url = `https://financialmodelingprep.com/api/v3/ipo_calendar?from=${from}&to=${to}&apikey=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`FMP IPO feed failed with status ${response.status}`);
    return [];
  }

  const payload = (await response.json()) as { ipoCalendar?: FmpIpoItem[] } | FmpIpoItem[];
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload.ipoCalendar) ? payload.ipoCalendar : [];

  return rows.map(mapFmpItemToRow).filter(hasCompanyName);
}

async function fetchAlphaVantageFeed(runtime: RuntimeEnv): Promise<FeedRow[]> {
  const apiKey = getRuntimeString(runtime, "ALPHA_VANTAGE_API_KEY");
  if (!apiKey) {
    return [];
  }

  const response = await fetch(`https://www.alphavantage.co/query?function=IPO_CALENDAR&apikey=${encodeURIComponent(apiKey)}`);
  if (!response.ok) {
    console.warn(`Alpha Vantage IPO feed failed with status ${response.status}`);
    return [];
  }

  const text = await response.text();
  const rows = parseCsv(text);

  return rows.map(mapAlphaVantageRow).filter(hasCompanyName);
}

async function fetchFinnhubFeed(from: string, to: string, runtime: RuntimeEnv): Promise<FeedRow[]> {
  const apiKey = getRuntimeString(runtime, "FINNHUB_API_KEY");
  if (!apiKey) {
    return [];
  }

  const response = await fetch(`https://finnhub.io/api/v1/calendar/ipo?from=${from}&to=${to}&token=${encodeURIComponent(apiKey)}`);
  if (!response.ok) {
    console.warn(`Finnhub IPO feed failed with status ${response.status}`);
    return [];
  }

  const payload = (await response.json()) as { ipoCalendar?: FinnhubIpoItem[] };
  const rows = Array.isArray(payload.ipoCalendar) ? payload.ipoCalendar : [];

  return rows.map(mapFinnhubRow).filter(hasCompanyName);
}

async function fetchChittorgarhHtmlFallbackFeed(): Promise<FeedRow[]> {
  const year = new Date().getFullYear();
  const listUrls = [
    `https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/all/?year=${year}`,
    `https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/mainboard/`,
  ];

  const linkMap = new Map<string, { url: string; title: string }>();

  for (const url of listUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        console.warn(`Chittorgarh fallback list fetch failed with status ${response.status}`);
        continue;
      }

      const html = await response.text();
      for (const item of extractChittorgarhIpoLinks(html)) {
        linkMap.set(item.url, item);
      }
    } catch (error) {
      console.warn(`Chittorgarh fallback list fetch failed: ${toErrorMessage(error)}`);
    }
  }

  const links = Array.from(linkMap.values()).slice(0, 24);
  if (links.length === 0) {
    return [];
  }

  const rows: FeedRow[] = [];
  for (const link of links) {
    try {
      const response = await fetch(link.url, {
        headers: {
          "user-agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        console.warn(`Chittorgarh fallback detail fetch failed with status ${response.status}`);
        rows.push(
          createFeedRow({
            company_name: normalizeCompanyTitle(link.title),
            external_url: link.url,
            source_name: "Chittorgarh HTML",
            summary: "No-key fallback feed",
          })
        );
        continue;
      }

      const detailHtml = await response.text();
      rows.push(mapChittorgarhDetailToRow(link, detailHtml));
    } catch (error) {
      console.warn(`Chittorgarh fallback detail fetch failed: ${toErrorMessage(error)}`);
      rows.push(
        createFeedRow({
          company_name: normalizeCompanyTitle(link.title),
          external_url: link.url,
          source_name: "Chittorgarh HTML",
          summary: "No-key fallback feed",
        })
      );
    }
  }

  return rows.filter(hasCompanyName);
}

function extractChittorgarhIpoLinks(html: string): Array<{ url: string; title: string }> {
  const regex = /href="(https:\/\/www\.chittorgarh\.com\/ipo\/[^"#?]+\/\d+\/)"\s+title="([^"]+IPO)"/gi;
  const links: Array<{ url: string; title: string }> = [];

  let match: RegExpExecArray | null = regex.exec(html);
  while (match) {
    links.push({
      url: match[1],
      title: decodeHtml(match[2]),
    });
    match = regex.exec(html);
  }

  return links;
}

function mapChittorgarhDetailToRow(link: { url: string; title: string }, detailHtml: string): FeedRow {
  const cleanedText = decodeHtml(stripTags(detailHtml));

  const companyName = normalizeCompanyTitle(link.title);
  const openCloseMatch = cleanedText.match(/opens on\s+[A-Za-z]{3},\s+([A-Za-z]{3}\s+\d{1,2},\s+\d{4})\s+and closes on\s+[A-Za-z]{3},\s+([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/i);
  const listingMatch = cleanedText.match(/\blist(?:ed)?\s+on\s+[^.]*?\s+on\s+([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/i);
  const priceBandMatch = cleanedText.match(/price band is\s*(₹?\s*[0-9,\-\s]+)(?:\s+per share|\.|,)/i);
  const fixedPriceMatch = cleanedText.match(/issue price is\s*(₹?\s*[0-9,\-\s]+)(?:\s+per share|\.|,)/i);
  const lotSizeMatch = cleanedText.match(/lot size is\s*([0-9,]+)/i);
  const issueSizeMatch = cleanedText.match(/aggregating up to\s*(₹?\s*[0-9,.\s]+\s*(?:Crores|Crore|Lakhs|Lakh|Million|Billion)?)/i);

  const openDate = parseMonthDayDate(openCloseMatch?.[1]);
  const closeDate = parseMonthDayDate(openCloseMatch?.[2]);
  const listingDate = parseMonthDayDate(listingMatch?.[1]);

  return createFeedRow({
    company_name: companyName,
    issue_open_date: openDate,
    issue_close_date: closeDate,
    listing_date: listingDate,
    price_band: normalizeInlineValue(priceBandMatch?.[1]) ?? normalizeInlineValue(fixedPriceMatch?.[1]),
    lot_size: normalizeInlineValue(lotSizeMatch?.[1]),
    issue_size: normalizeInlineValue(issueSizeMatch?.[1]),
    source_name: "Chittorgarh HTML",
    external_url: link.url,
    summary: "No-key fallback feed",
    status: deriveStatus(openDate, closeDate, listingDate),
  });
}

function normalizeCompanyTitle(title: string): string {
  const normalized = decodeHtml(title).trim();
  return normalized.endsWith(" IPO") ? normalized.slice(0, -4).trim() : normalized;
}

function parseMonthDayDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value.replace(/\s+/g, " ").trim());
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function normalizeInlineValue(value: string | undefined): string | null {
  if (!value) return null;
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > 0 ? collapsed : null;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function decodeHtml(value: string): string {
  return value
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u2019/gi, "'")
    .replace(/&#8377;|₹/g, "Rs ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function mergeRows(target: Map<string, FeedRow>, rows: FeedRow[]) {
  for (const row of rows) {
    const key = row.source_key ?? `${row.symbol ?? "NA"}-${row.company_name}-${row.issue_open_date ?? "NA"}`;
    const existing = target.get(key);
    if (!existing) {
      target.set(key, row);
      continue;
    }

    target.set(key, mergeIpoRow(existing, row));
  }
}

function mergeIpoRow(base: FeedRow, incoming: FeedRow): FeedRow {
  return {
    ...base,
    company_name: pickBetter(base.company_name, incoming.company_name) ?? base.company_name,
    symbol: pickBetter(base.symbol, incoming.symbol),
    issue_open_date: pickBetter(base.issue_open_date, incoming.issue_open_date),
    issue_close_date: pickBetter(base.issue_close_date, incoming.issue_close_date),
    listing_date: pickBetter(base.listing_date, incoming.listing_date),
    price_band: pickBetter(base.price_band, incoming.price_band),
    lot_size: pickBetter(base.lot_size, incoming.lot_size),
    issue_size: pickBetter(base.issue_size, incoming.issue_size),
    gmp: pickBetter(base.gmp, incoming.gmp),
    merchant_banker: pickBetter(base.merchant_banker, incoming.merchant_banker),
    anchor_investors: pickBetter(base.anchor_investors, incoming.anchor_investors),
    subscription: pickBetter(base.subscription, incoming.subscription),
    status: pickStatus(base.status, incoming.status),
    source_name: mergeSummary(base.source_name, incoming.source_name),
    external_url: pickBetter(base.external_url, incoming.external_url),
    summary: mergeSummary(base.summary, incoming.summary),
    my_recommendation: base.my_recommendation,
    published: base.published ?? incoming.published,
    created_at: base.created_at,
    updated_at: new Date().toISOString(),
    source_key: base.source_key ?? incoming.source_key,
  };
}

async function upsertIpoRows(client: SupabaseClient, baseUpserts: FeedRow[]): Promise<number> {
  if (baseUpserts.length === 0) {
    return 0;
  }

  const sourceKeys = baseUpserts
    .map((row) => row.source_key)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  let existingBySourceKey = new Map<string, { my_recommendation: string | null; published: boolean | null; created_at: string | null }>();

  if (sourceKeys.length > 0) {
    const { data: existingRows, error: existingError } = await client
      .from("ipo_entries")
      .select("source_key,my_recommendation,published,created_at")
      .in("source_key", sourceKeys);

    if (existingError) throw existingError;

    existingBySourceKey = new Map(
      (existingRows ?? [])
        .map((row) => {
          const sourceKey = typeof row.source_key === "string" ? row.source_key : "";
          return [
            sourceKey,
            {
              my_recommendation: typeof row.my_recommendation === "string" ? row.my_recommendation : null,
              published: typeof row.published === "boolean" ? row.published : null,
              created_at: typeof row.created_at === "string" ? row.created_at : null,
            },
          ] as const;
        })
        .filter(([sourceKey]) => sourceKey.length > 0)
    );
  }

  const upserts = baseUpserts.map((row) => {
    if (!row.source_key) return row;

    const existing = existingBySourceKey.get(row.source_key);
    if (!existing) return row;

    return {
      ...row,
      my_recommendation: existing.my_recommendation,
      published: existing.published ?? row.published,
      created_at: existing.created_at ?? row.created_at,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await client.from("ipo_entries").upsert(upserts, { onConflict: "source_key" });
  if (error) throw error;

  return upserts.length;
}

function mapFmpItemToRow(item: FmpIpoItem): FeedRow {
  const companyName = cleanText(item.company);
  const symbol = cleanText(item.symbol)?.toUpperCase() ?? null;
  const openDate = normalizeDate(item.date);

  return createFeedRow({
    company_name: companyName,
    symbol,
    issue_open_date: openDate,
    price_band: cleanText(item.priceRange),
    issue_size: toIssueSize(item.shares),
    source_name: "Financial Modeling Prep",
    summary: [cleanText(item.exchange), cleanText(item.actions)].filter(Boolean).join(" | ") || null,
  });
}

function mapAlphaVantageRow(row: Record<string, string>): FeedRow {
  const low = cleanText(row.priceRangeLow);
  const high = cleanText(row.priceRangeHigh);
  const priceBand = low && high ? `${low} - ${high}` : low ?? high ?? null;

  return createFeedRow({
    company_name: cleanText(row.name) ?? "",
    symbol: cleanText(row.symbol)?.toUpperCase() ?? null,
    issue_open_date: normalizeDate(row.ipoDate),
    price_band: priceBand,
    issue_size: cleanText(row.totalSharesValue),
    source_name: "Alpha Vantage",
    summary: [cleanText(row.exchange), cleanText(row.status), cleanText(row.currency)].filter(Boolean).join(" | ") || null,
    status: normalizeStatus(cleanText(row.status), normalizeDate(row.ipoDate), null),
  });
}

function mapFinnhubRow(item: FinnhubIpoItem): FeedRow {
  const price = cleanNumberString(item.price);
  const priceBand = price ? `${price}` : null;

  return createFeedRow({
    company_name: cleanText(item.name) ?? "",
    symbol: cleanText(item.symbol)?.toUpperCase() ?? null,
    issue_open_date: normalizeDate(item.date),
    price_band: priceBand,
    issue_size: toIssueSize(item.numberOfShares),
    source_name: "Finnhub",
    summary: [cleanText(item.exchange), cleanText(item.status)].filter(Boolean).join(" | ") || null,
    status: normalizeStatus(cleanText(item.status), normalizeDate(item.date), null),
  });
}

function createFeedRow(input: Partial<FeedRow> & Pick<FeedRow, "company_name">): FeedRow {
  const companyName = cleanText(input.company_name) ?? "";
  const symbol = cleanText(input.symbol)?.toUpperCase() ?? null;
  const issueOpenDate = input.issue_open_date ?? null;
  const issueCloseDate = input.issue_close_date ?? null;
  const listingDate = input.listing_date ?? null;
  const sourceKey = buildSourceKey(symbol, companyName, issueOpenDate);
  const now = new Date().toISOString();

  return {
    source_key: sourceKey,
    company_name: companyName,
    symbol,
    issue_open_date: issueOpenDate,
    issue_close_date: issueCloseDate,
    listing_date: listingDate,
    price_band: cleanText(input.price_band),
    lot_size: cleanText(input.lot_size),
    issue_size: cleanText(input.issue_size),
    gmp: cleanText(input.gmp),
    merchant_banker: cleanText(input.merchant_banker),
    anchor_investors: cleanText(input.anchor_investors),
    subscription: cleanText(input.subscription),
    status: input.status ?? deriveStatus(issueOpenDate, issueCloseDate, listingDate),
    source_name: cleanText(input.source_name),
    external_url: cleanText(input.external_url),
    summary: cleanText(input.summary),
    my_recommendation: null,
    published: true,
    created_at: now,
    updated_at: now,
  };
}

function parseCsv(csv: string): Array<Record<string, string>> {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<Record<string, string>>((accumulator, header, index) => {
      accumulator[header] = values[index] ?? "";
      return accumulator;
    }, {});
  });
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function hasCompanyName(row: FeedRow): boolean {
  return row.company_name.trim().length > 0;
}

function buildSourceKey(symbol: string | null, companyName: string, openDate: string | null): string {
  return `${symbol ?? "NA"}-${companyName}-${openDate ?? "NA"}`;
}

function currentDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function futureDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function normalizeDate(value: string | undefined | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function deriveStatus(issueOpenDate: string | null, issueCloseDate: string | null, listingDate: string | null): IpoStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const openDate = toStartOfDay(issueOpenDate);
  const closeDate = toStartOfDay(issueCloseDate);
  const listedDate = toStartOfDay(listingDate);

  if (listedDate && listedDate <= today) return "listed";
  if (openDate && openDate > today) return "upcoming";
  if (openDate && openDate <= today && (!closeDate || closeDate >= today)) return "open";
  if (closeDate && closeDate < today) return "closed";
  return "upcoming";
}

function normalizeStatus(status: string | null, issueOpenDate: string | null, listingDate: string | null): IpoStatus {
  const normalized = status?.trim().toLowerCase() ?? "";
  if (normalized.includes("list")) return "listed";
  if (normalized.includes("open")) return "open";
  if (normalized.includes("close")) return "closed";
  if (normalized.includes("upcoming") || normalized.includes("filed") || normalized.includes("expected")) return "upcoming";
  return deriveStatus(issueOpenDate, null, listingDate);
}

function toStartOfDay(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function cleanText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function cleanNumberString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function toIssueSize(value: string | number | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "number") return String(value);
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function pickBetter(current: string | null | undefined, incoming: string | null | undefined): string | null {
  const currentValue = cleanText(current);
  const incomingValue = cleanText(incoming);
  if (!incomingValue) return currentValue ?? null;
  if (!currentValue) return incomingValue;
  return incomingValue.length > currentValue.length ? incomingValue : currentValue;
}

function pickStatus(current: IpoStatus | null | undefined, incoming: IpoStatus | null | undefined): IpoStatus {
  const priority: Record<IpoStatus, number> = {
    upcoming: 1,
    open: 2,
    closed: 3,
    listed: 4,
  };

  if (!current) return incoming ?? "upcoming";
  if (!incoming) return current;
  return priority[incoming] >= priority[current] ? incoming : current;
}

function mergeSummary(current: string | null | undefined, incoming: string | null | undefined): string | null {
  const parts = [cleanText(current), cleanText(incoming)].filter((value): value is string => Boolean(value));
  if (parts.length === 0) return null;
  return Array.from(new Set(parts)).join(" | ");
}

function getRuntimeString(runtime: RuntimeEnv, key: string): string | null {
  const direct = asNonEmptyString(runtime[key]);
  if (direct) {
    return direct;
  }

  const cloudflare = asObject(runtime.cloudflare);
  const context = asObject(runtime.context);
  const platform = asObject(runtime.platform);

  const containers: unknown[] = [
    runtime.env,
    runtime.bindings,
    cloudflare?.env,
    context?.cloudflare,
    asObject(context?.cloudflare)?.env,
    platform?.env,
    asObject(platform?.cf)?.env,
  ];

  for (const container of containers) {
    const containerObject = asObject(container);
    if (!containerObject) continue;
    const containerValue = asNonEmptyString(containerObject[key]);
    if (containerValue) {
      return containerValue;
    }
  }

  const processValue = typeof process !== "undefined" ? asNonEmptyString(process.env[key]) : null;
  if (processValue) {
    return processValue;
  }

  const directImportMetaValue = asNonEmptyString(IMPORT_META_ENV_MAP[key]);
  if (directImportMetaValue) {
    return directImportMetaValue;
  }

  if (!key.startsWith("VITE_")) {
    const viteAliasValue = asNonEmptyString(IMPORT_META_ENV_MAP[`VITE_${key}`]);
    if (viteAliasValue) {
      return viteAliasValue;
    }
  }

  return null;
}

function getFirstRuntimeString(runtime: RuntimeEnv, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = getRuntimeString(runtime, key);
    if (value) {
      return value;
    }
  }
  return null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toErrorMessage(error: unknown, fallback = "Unknown error"): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim();
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
      error_description?: unknown;
    };

    const parts = [candidate.message, candidate.details, candidate.hint, candidate.error_description, candidate.code]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);

    if (parts.length > 0) {
      return Array.from(new Set(parts)).join(" | ");
    }
  }

  return fallback;
}

async function insertIpoSyncRun(
  client: SupabaseClient,
  run: {
    source: string;
    status: "success" | "failure";
    synced_count: number;
    error_message: string | null;
    ran_at: string;
  }
): Promise<void> {
  const { error } = await client.from("ipo_sync_runs").insert(run);
  if (error) {
    console.error("Failed to record ipo_sync_runs:", error.message);
  }
}
