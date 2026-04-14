const params = new URLSearchParams(window.location.search);
const reportId = params.get("id");

const titleEl = document.getElementById("reportTitle");
const metaEl = document.getElementById("reportMeta");
const contentEl = document.getElementById("reportContent");
const downloadMarkdownEl = document.getElementById("downloadMarkdown");
const downloadJsonEl = document.getElementById("downloadJson");
const printReportEl = document.getElementById("printReport");

let report = null;

async function boot() {
  if (!reportId) {
    renderError("Missing report id. Open a report from the dashboard list.");
    return;
  }

  try {
    const manifest = await fetchJSON("reports/index.json");
    const meta = manifest.reports.find((item) => item.file === reportId);

    if (!meta) {
      renderError(`Report not found in manifest: ${reportId}`);
      return;
    }

    report = await loadReport(meta);
    renderReport(report);
    wireDownloads(report);
  } catch (error) {
    renderError(`Could not load report: ${error.message}`);
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

function renderReport(data) {
  document.title = `${data.title} · Report Detail`;
  titleEl.textContent = data.title;
  metaEl.textContent = `${data.date} • ${data.type} • Source: ${data.source}`;

  const score = Number.isFinite(data.score) ? data.score : "n/a";
  const tags = data.tags.length ? data.tags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("") : '<span class="muted">No tags</span>';

  contentEl.innerHTML = `
    <section class="report-section">
      <h2>Summary</h2>
      <p>${escapeHtml(data.summary)}</p>
    </section>
    <section class="report-section">
      <h2>Metadata</h2>
      <p><strong>Score:</strong> ${escapeHtml(score)}</p>
      <p><strong>Pages Reviewed:</strong> ${escapeHtml(data.pagesReviewed || 0)}</p>
      <p><strong>Tags:</strong> ${tags}</p>
    </section>
    <section class="report-section">
      <h2>Issues</h2>
      ${renderList(data.issues)}
    </section>
    <section class="report-section">
      <h2>Findings</h2>
      ${renderList(data.findings)}
    </section>
    <section class="report-section">
      <h2>Raw Data</h2>
      <pre class="preview">${escapeHtml(data.rawPreview)}</pre>
    </section>
  `;
}

function renderList(items) {
  if (!items.length) return '<p class="muted">None</p>';
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function wireDownloads(data) {
  downloadMarkdownEl.addEventListener("click", () => {
    const markdown = toMarkdown(data);
    downloadFile(`${safeName(data.title)}.md`, markdown, "text/markdown");
  });

  downloadJsonEl.addEventListener("click", () => {
    const json = JSON.stringify(toJsonData(data), null, 2);
    downloadFile(`${safeName(data.title)}.json`, json, "application/json");
  });

  printReportEl.addEventListener("click", () => {
    window.print();
  });
}

function toMarkdown(data) {
  const lines = [
    `# ${data.title}`,
    "",
    `date: ${data.date}`,
    `type: ${data.type}`,
    `source: ${data.source}`,
    `score: ${Number.isFinite(data.score) ? data.score : "n/a"}`,
    `pagesReviewed: ${data.pagesReviewed || 0}`,
    `tags: ${data.tags.join(", ")}`,
    "",
    "## summary",
    data.summary,
    "",
    "## issues",
    ...(data.issues.length ? data.issues.map((issue) => `- ${issue}`) : ["- None"]),
    "",
    "## findings",
    ...(data.findings.length ? data.findings.map((finding) => `- ${finding}`) : ["- None"]),
    "",
  ];
  return lines.join("\n");
}

function toJsonData(data) {
  return {
    title: data.title,
    date: data.date,
    type: data.type,
    source: data.source,
    summary: data.summary,
    score: Number.isFinite(data.score) ? data.score : null,
    pagesReviewed: data.pagesReviewed || 0,
    tags: data.tags,
    issues: data.issues,
    findings: data.findings,
    raw: data.rawPreview,
  };
}

function downloadFile(name, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "report";
}

function renderError(message) {
  titleEl.textContent = "Report Detail";
  metaEl.textContent = "";
  contentEl.innerHTML = `<p class="muted">${escapeHtml(message)}</p>`;
  downloadMarkdownEl.disabled = true;
  downloadJsonEl.disabled = true;
  printReportEl.disabled = true;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

boot();
