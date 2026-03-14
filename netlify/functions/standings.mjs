import { load } from "cheerio";

const STANDINGS_URL = "https://www.khl.ru/standings/";

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0400-\u04ff-]/g, "");

const parseTable = ($, table) => {
  const teams = [];
  const rows = $(table).find("tr");
  rows.each((index, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;
    const seedText = $(cells[0]).text().trim();
    const seed = Number.parseInt(seedText, 10);
    const nameCell =
      cells
        .toArray()
        .map((cell) => $(cell))
        .find((cell) =>
          cell.attr("class")?.toLowerCase().includes("team") ||
          cell.attr("class")?.toLowerCase().includes("name"),
        ) ?? $(cells[1]);
    const name = nameCell.find("a").first().text().trim() || nameCell.text().trim();
    if (!name) return;
    const finalSeed = Number.isNaN(seed) ? index : seed;
    teams.push({
      id: slugify(name),
      name,
      seed: finalSeed,
    });
  });
  return teams.filter((team) => team.seed > 0).slice(0, 8);
};

const extractFromTables = ($) => {
  const tables = $("table").toArray();
  if (tables.length < 2) return null;
  const west = parseTable($, tables[0]);
  const east = parseTable($, tables[1]);
  if (west.length === 0 || east.length === 0) return null;
  return { west, east };
};

const extractFromNextData = ($) => {
  const script = $("#__NEXT_DATA__").text();
  if (!script) return null;
  try {
    const data = JSON.parse(script);
    const candidates = [];
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      const keys = Object.keys(node);
      if (keys.includes("standings") || keys.includes("tables")) {
        candidates.push(node);
      }
      for (const key of keys) {
        walk(node[key]);
      }
    };
    walk(data);
    for (const candidate of candidates) {
      const standings = candidate.standings || candidate.tables || candidate;
      if (standings?.west && standings?.east) {
        return { west: standings.west, east: standings.east };
      }
      if (standings?.western && standings?.eastern) {
        return { west: standings.western, east: standings.eastern };
      }
    }
  } catch {
    return null;
  }
  return null;
};

export async function handler() {
  try {
    const response = await fetch(STANDINGS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Netlify Function)",
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Failed to fetch standings" }),
      };
    }

    const html = await response.text();
    const $ = load(html);

    const fromNext = extractFromNextData($);
    const fromTables = extractFromTables($);
    const data = fromNext ?? fromTables;

    if (!data) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Unable to parse standings" }),
      };
    }

    const normalize = (teams) =>
      teams
        .map((team, index) => {
          const name = team.name ?? team.team ?? team.title ?? "";
          const seed = team.seed ?? team.place ?? team.position ?? index + 1;
          if (!name) return null;
          return {
            id: team.id ?? slugify(name),
            name,
            seed: Number(seed),
          };
        })
        .filter(Boolean)
        .slice(0, 8);

    const west = normalize(data.west);
    const east = normalize(data.east);

    if (west.length === 0 || east.length === 0) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Standings data empty" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        updatedAt: new Date().toISOString(),
        west,
        east,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error" }),
    };
  }
}
