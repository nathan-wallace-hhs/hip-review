const promptTextEl = document.getElementById("promptText");
const copyPromptBtn = document.getElementById("copyPromptBtn");
const copyStatusEl = document.getElementById("copyStatus");

const fillFormEl = document.getElementById("promptFillForm");
const generatePromptBtn = document.getElementById("generatePromptBtn");
const copyFilledPromptBtn = document.getElementById("copyFilledPromptBtn");
const filledPromptTextEl = document.getElementById("filledPromptText");
const fillStatusEl = document.getElementById("fillStatus");

const PLACEHOLDER_FALLBACKS = {
  page_url: "https://www.example.gov/page",
  page_title_and_stated_purpose: "[Add page title and purpose]",
  top_1_to_3_user_jobs: "[Add top user tasks]",
  conversion_or_outcome: "[Add agency goal]",
  date: "[Add audit date]",
  reviewer: "[Add reviewer name]",
  hip_number: "##",
  page_title: "[Add page title]"
};

async function loadPrompt() {
  try {
    const response = await fetch("UX_CONTENT_AUDIT_PROMPT.md");
    if (!response.ok) throw new Error(`Failed to fetch prompt (${response.status})`);
    const text = await response.text();
    promptTextEl.value = text;
  } catch (error) {
    promptTextEl.value = "Unable to load UX_CONTENT_AUDIT_PROMPT.md. Ensure the file exists at the project root.";
    copyPromptBtn.disabled = true;
    generatePromptBtn.disabled = true;
    copyFilledPromptBtn.disabled = true;
    copyStatusEl.textContent = error.message;
  }
}

function formatHipNumber(value) {
  if (!value) return PLACEHOLDER_FALLBACKS.hip_number;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 50) return PLACEHOLDER_FALLBACKS.hip_number;
  return String(parsed).padStart(2, "0");
}

function getFieldValue(name) {
  const raw = String(fillFormEl.elements[name]?.value || "").trim();
  if (!raw) return PLACEHOLDER_FALLBACKS[name] || "";
  return raw;
}

function buildFilledPrompt() {
  const basePrompt = promptTextEl.value;
  if (!basePrompt.trim()) return "";

  const values = {
    page_url: getFieldValue("page_url"),
    page_title_and_stated_purpose: getFieldValue("page_title_and_stated_purpose"),
    top_1_to_3_user_jobs: getFieldValue("top_1_to_3_user_jobs"),
    conversion_or_outcome: getFieldValue("conversion_or_outcome"),
    date: getFieldValue("date"),
    reviewer: getFieldValue("reviewer"),
    page_title: getFieldValue("page_title"),
    hip_number: formatHipNumber(getFieldValue("hip_number"))
  };

  return basePrompt
    .replaceAll("{{page_url}}", values.page_url)
    .replaceAll("{{page_title_and_stated_purpose}}", values.page_title_and_stated_purpose)
    .replaceAll("{{top_1_to_3_user_jobs}}", values.top_1_to_3_user_jobs)
    .replaceAll("{{conversion_or_outcome}}", values.conversion_or_outcome)
    .replaceAll("{{date}}", values.date)
    .replaceAll("{{reviewer}}", values.reviewer)
    .replaceAll("{{page_title}}", values.page_title)
    .replaceAll("HIP-{{##}}-of-50", `HIP-${values.hip_number}-of-50`);
}

copyPromptBtn.addEventListener("click", async () => {
  const prompt = promptTextEl.value;
  if (!prompt.trim()) {
    copyStatusEl.textContent = "Prompt text is empty.";
    return;
  }

  try {
    await navigator.clipboard.writeText(prompt);
    copyStatusEl.textContent = "Prompt copied to clipboard.";
  } catch (error) {
    copyStatusEl.textContent = "Clipboard copy failed. Select the text and copy manually.";
  }
});

generatePromptBtn.addEventListener("click", () => {
  const filledPrompt = buildFilledPrompt();
  if (!filledPrompt) {
    fillStatusEl.textContent = "Unable to generate prompt because base template is empty.";
    return;
  }

  filledPromptTextEl.value = filledPrompt;
  fillStatusEl.textContent = "Filled prompt generated. Review and copy when ready.";
});

copyFilledPromptBtn.addEventListener("click", async () => {
  const prompt = filledPromptTextEl.value;
  if (!prompt.trim()) {
    fillStatusEl.textContent = "Generate the filled prompt first.";
    return;
  }

  try {
    await navigator.clipboard.writeText(prompt);
    fillStatusEl.textContent = "Filled prompt copied to clipboard.";
  } catch (error) {
    fillStatusEl.textContent = "Clipboard copy failed. Select the filled prompt and copy manually.";
  }
});

loadPrompt();
