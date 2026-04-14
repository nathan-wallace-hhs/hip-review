const promptTextEl = document.getElementById("promptText");
const copyPromptBtn = document.getElementById("copyPromptBtn");
const copyStatusEl = document.getElementById("copyStatus");

async function loadPrompt() {
  try {
    const response = await fetch("UX_CONTENT_AUDIT_PROMPT.md");
    if (!response.ok) throw new Error(`Failed to fetch prompt (${response.status})`);
    const text = await response.text();
    promptTextEl.value = text;
  } catch (error) {
    promptTextEl.value = "Unable to load UX_CONTENT_AUDIT_PROMPT.md. Ensure the file exists at the project root.";
    copyPromptBtn.disabled = true;
    copyStatusEl.textContent = error.message;
  }
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

loadPrompt();
