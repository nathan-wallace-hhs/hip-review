const state = {
  reports: [],
  filtered: [],
};

const searchEl = document.getElementById("search");
const typeFilterEl = document.getElementById("typeFilter");
const tagFilterEl = document.getElementById("tagFilter");
const reportListEl = document.getElementById("reportList");
const metricsEl = document.getElementById("metrics");
const insightsEl = document.getElementById("insights");

async function boot() {
  try {
    const manifest = await fetchJSON("reports/index.json");
    const rows = await Promise.all(manifest.reports.map(loadReport));
    state.reports = rows.sort((a, b) => new Date(b.date) - new Date(a.date));
    syncTagFilter();
    applyFilters();
  } catch (error) {
    renderError(
      `Could not load report data. Ensure reports/index.json exists and each file path is valid.\n${error.message}`
    );
  }
}

async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to fetch ${path} (${response.status})`);
  return response.json();
}

async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to fetch ${path} (${response.status})`);
  return response.text();
}

async function loadReport(meta) {
  const type = normalizeType(meta.type || meta.file);
  if (type === "json") {
    const data = await fetchJSON(meta.file);
    return normalizeJsonReport(meta, data);
  }
  const markdown = await fetchText(meta.file);
  return normalizeMarkdownReport(meta, markdown);
}

function normalizeType(value = "") {
  const v = value.toLowerCase();
  if (v.endsWith(".json") || v === "json") return "json";
  return "markdown";
}

function normalizeJsonReport(meta, data) {
  const issues = Array.isArray(data.issues)
    ? data.issues.map((item) => (typeof item === "string" ? item : item.title || "Unknown issue"))
    : [];

  const findings = Array.isArray(data.findings)
    ? data.findings.map((f) => (typeof f === "string" ? f : f.summary || JSON.stringify(f)))
    : [];

  const pagesReviewed =
    data.pagesReviewed ||
    (Array.isArray(data.pages) ? data.pages.length : undefined) ||
    Number(data.pageCount || 0) ||
    0;

  const score = Number(data.score);

  return {
    id: meta.file,
    type: "json",
    title: meta.title || data.title || nameFromPath(meta.file),
    date: meta.date || data.date || "1970-01-01",
    tags: normalizeTags(meta.tags || data.tags),
    summary: data.summary || data.overview || "No summary provided.",
    issues,
    findings,
    score: Number.isFinite(score) ? score : null,
    pagesReviewed,
    rawPreview: JSON.stringify(data, null, 2),
    source: meta.file,
  };
}

function normalizeMarkdownReport(meta, markdown) {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const dateMatch = markdown.match(/date:\s*([0-9-]{8,10})/i);
  const scoreMatch = markdown.match(/score:\s*([0-9]+(?:\.[0-9]+)?)/i);
  const pagesMatch = markdown.match(/pagesReviewed:\s*(\d+)/i);

  const issues = extractMarkdownList(markdown, "issues");
  const findings = extractMarkdownList(markdown, "findings");

  const summary = extractMarkdownSection(markdown, "summary") || "No summary provided.";

  return {
    id: meta.file,
    type: "markdown",
    title: meta.title || titleMatch?.[1]?.trim() || nameFromPath(meta.file),
    date: meta.date || dateMatch?.[1] || "1970-01-01",
    tags: normalizeTags(meta.tags || extractInlineTags(markdown)),
    summary,
    issues,
    findings,
    score: scoreMatch ? Number(scoreMatch[1]) : null,
    pagesReviewed: pagesMatch ? Number(pagesMatch[1]) : 0,
    rawPreview: markdown,
    source: meta.file,
  };
}

function extractMarkdownList(markdown, heading) {
  const block = extractMarkdownSection(markdown, heading);
  if (!block) return [];
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("*"))
    .map((line) => line.replace(/^[-*]\s*/, "").trim());
}

function extractMarkdownSection(markdown, heading) {
  const regex = new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(^##\\s+|$)`, "im");
  const match = markdown.match(regex);
  return match ? match[1].trim() : "";
}

function extractInlineTags(markdown) {
  const tagLine = markdown.match(/tags:\s*(.+)$/im);
  if (!tagLine) return [];
  return tagLine[1]
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  return String(tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function nameFromPath(path) {
  return path.split("/").pop().replace(/\.(json|md|markdown)$/i, "");
}

function syncTagFilter() {
  const tags = [...new Set(state.reports.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b));
  tagFilterEl.innerHTML = '<option value="all">All tags</option>';
  tags.forEach((tag) => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    tagFilterEl.appendChild(opt);
  });
}

function applyFilters() {
  const q = searchEl.value.trim().toLowerCase();
  const typeFilter = typeFilterEl.value;
  const tagFilter = tagFilterEl.value;

  state.filtered = state.reports.filter((report) => {
    if (typeFilter !== "all" && report.type !== typeFilter) return false;
    if (tagFilter !== "all" && !report.tags.includes(tagFilter)) return false;

    if (!q) return true;
    const haystack = [
      report.title,
      report.summary,
      report.issues.join(" "),
      report.findings.join(" "),
      report.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  render();
}

function render() {
  renderMetrics();
  renderInsights();
  renderList();
}

function renderMetrics() {
  const reports = state.filtered;
  const total = reports.length;
  const avgScore = average(reports.map((r) => r.score).filter((v) => Number.isFinite(v)));
  const pages = reports.reduce((sum, r) => sum + (r.pagesReviewed || 0), 0);
  const issues = reports.reduce((sum, r) => sum + r.issues.length, 0);

  const cards = [
    ["Reports", total],
    ["Average Score", avgScore === null ? "n/a" : avgScore.toFixed(1)],
    ["Pages Reviewed", pages],
    ["Total Issues", issues],
  ];

  metricsEl.innerHTML = cards
    .map(
      ([label, value]) =>
        `<article class="panel metric"><span class="muted">${label}</span><strong>${value}</strong></article>`
    )
    .join("");
}

function renderInsights() {
  const reports = state.filtered;
  const issueCount = new Map();

  reports.forEach((r) => {
    r.issues.forEach((issue) => {
      const key = issue.toLowerCase();
      issueCount.set(key, (issueCount.get(key) || 0) + 1);
    });
  });

  const topIssues = [...issueCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => `${toTitle(issue)} (${count})`);

  const bestReport = reports
    .filter((r) => Number.isFinite(r.score))
    .sort((a, b) => b.score - a.score)[0];

  insightsEl.innerHTML = `
    <p><strong>Top recurring issues</strong></p>
    <ul class="insight-list">
      ${topIssues.length ? topIssues.map((i) => `<li>${i}</li>`).join("") : "<li>No issues found.</li>"}
    </ul>
    <p><strong>Highest score</strong>: ${bestReport ? `${bestReport.title} (${bestReport.score})` : "n/a"}</p>
  `;
}

function renderList() {
  reportListEl.innerHTML = state.filtered
    .map((r) => {
      return `
        <li class="report-item">
          <div><strong>${escapeHtml(r.title)}</strong></div>
          <div class="muted">${escapeHtml(r.date)} • ${escapeHtml(r.type)}</div>
          <div>${r.tags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}</div>
          <div class="report-item-actions">
            <a class="link-button" href="report.html?id=${encodeURIComponent(r.id)}">Open report</a>
          </div>
        </li>
      `;
    })
    .join("");
}

function renderError(message) {
  metricsEl.innerHTML = "";
  insightsEl.innerHTML = `<p class="muted">${escapeHtml(message)}</p>`;
  reportListEl.innerHTML = "";
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function toTitle(value) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

searchEl.addEventListener("input", applyFilters);
typeFilterEl.addEventListener("change", applyFilters);
tagFilterEl.addEventListener("change", applyFilters);

boot();
