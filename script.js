const promptInput = document.getElementById("promptInput");
const projectTypeInputs = document.querySelectorAll("input[name='projectType']");
const dsaLanguageSelect = document.getElementById("dsaLanguageSelect");
const backendLanguageSelect = document.getElementById("backendLanguageSelect");
const dsaLanguageGroup = document.getElementById("dsaLanguageGroup");
const backendLanguageGroup = document.getElementById("backendLanguageGroup");
const frontendNote = document.getElementById("frontendNote");
const generateBtn = document.getElementById("generateBtn");
const promptSummary = document.getElementById("promptSummary");
const promptMeta = document.getElementById("promptMeta");
const promptFeatures = document.getElementById("promptFeatures");
const promptArchitecture = document.getElementById("promptArchitecture");
const promptImplementation = document.getElementById("promptImplementation");
const promptConstraints = document.getElementById("promptConstraints");
const promptRaw = document.getElementById("promptRaw");
const promptFeaturesCard = document.getElementById("promptFeaturesCard");
const promptArchitectureCard = document.getElementById("promptArchitectureCard");
const promptImplementationCard = document.getElementById("promptImplementationCard");
const promptConstraintsCard = document.getElementById("promptConstraintsCard");
const generatedCode = document.getElementById("generatedCode");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const toggleThemeBtn = document.getElementById("toggleThemeBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const livePreviewBtn = document.getElementById("livePreviewBtn");
const errorText = document.getElementById("errorText");
const appSubtitle = document.getElementById("appSubtitle");
const languageMarquee = document.getElementById("languageMarquee");
const particleCanvas = document.getElementById("particleCanvas");
const cursorGlow = document.getElementById("cursorGlow");
const cursorDot = document.getElementById("cursorDot");
const historyMenu = document.getElementById("historyMenu");
const historyToggle = document.getElementById("historyToggle");
const historyDropdown = document.getElementById("historyDropdown");
const editorShell = document.getElementById("editorShell");
const editorPre = document.getElementById("editorPre");
const fileLabel = document.getElementById("fileLabel");
const languageBadge = document.getElementById("languageBadge");
const fullscreenFileLabel = document.getElementById("fullscreenFileLabel");
const fullscreenLanguageBadge = document.getElementById("fullscreenLanguageBadge");
const prismThemeDark = document.getElementById("prismThemeDark");
const prismThemeLight = document.getElementById("prismThemeLight");
const startBtn = document.getElementById("startBtn");
const inputSection = document.getElementById("input-section");
const outputSection = document.getElementById("output-section");
const heroSection = document.getElementById("hero-section");
const promptPanel = document.getElementById("prompt-panel");
const codePanel = document.getElementById("code-panel");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabIndicator = document.getElementById("tabIndicator");
const homeBtnInput = document.getElementById("homeBtnInput");
const homeBtnOutput = document.getElementById("homeBtnOutput");
const modifyInputBtn = document.getElementById("modifyInputBtn");
const pageScroll = document.querySelector(".page-scroll");
const editorModal = document.getElementById("editorModal");
const editorModalContent = document.getElementById("editorModalContent");
const fullscreenPre = document.getElementById("fullscreenPre");
const fullscreenCode = document.getElementById("fullscreenCode");
const fullscreenCloseBtn = document.getElementById("fullscreenCloseBtn");
const previewModal = document.getElementById("previewModal");
const previewFrame = document.getElementById("previewFrame");
const previewCloseBtn = document.getElementById("previewCloseBtn");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// Use same-origin when served by Flask; fallback to localhost for file:// usage.
const API_BASE = "http://127.0.0.1:5000";
let codeTheme = "dark";
let generationCounter = 0;
let autoTabTimeout = null;
let historyEntries = [];
let activeHistoryPrompt = "";
let historyDropdownOpen = false;
let isGenerating = false;

const PROJECT_TYPE_LABELS = {
  dsa: "DSA & Algorithms",
  frontend: "Frontend Development",
  backend: "Backend Development",
};

const DSA_LANGUAGES = ["Python", "Java", "C", "C++"];
const BACKEND_LANGUAGES = ["Python", "Node.js"];
const FRONTEND_LANGUAGE_KEY = "HTML with inline CSS and JavaScript";
const HISTORY_STORAGE_KEY = "recentGenerations";
const HISTORY_LIMIT = 10;

const LANGUAGE_ACCENTS = {
  "python": { color: "rgba(77, 163, 255, 0.8)", glow: "rgba(77, 163, 255, 0.45)" },
  "java": { color: "rgba(255, 155, 77, 0.85)", glow: "rgba(255, 155, 77, 0.4)" },
  "c": { color: "rgba(123, 220, 255, 0.8)", glow: "rgba(123, 220, 255, 0.4)" },
  "c++": { color: "rgba(70, 240, 255, 0.85)", glow: "rgba(70, 240, 255, 0.4)" },
  "node.js": { color: "rgba(107, 255, 154, 0.85)", glow: "rgba(107, 255, 154, 0.45)" },
  "html/css/js": { color: "rgba(255, 211, 106, 0.85)", glow: "rgba(255, 211, 106, 0.4)" },
};

const LANGUAGE_CATALOG = {
  "Python": { prompt_name: "Python", prism_name: "python", file_label: "main.py" },
  "Java": { prompt_name: "Java", prism_name: "java", file_label: "Main.java" },
  "C": { prompt_name: "C", prism_name: "c", file_label: "main.c" },
  "C++": { prompt_name: "C++", prism_name: "cpp", file_label: "main.cpp" },
  "Node.js": { prompt_name: "Node.js", prism_name: "javascript", file_label: "server.js" },
  "HTML with inline CSS and JavaScript": {
    prompt_name: "HTML with inline CSS and JavaScript",
    prism_name: "markup",
    file_label: "index.html",
  },
};

function normalizePromptKey(text) {
  return (text || "").trim();
}

function normalizeHistoryEntry(entry) {
  if (!entry || typeof entry.userPrompt !== "string") return null;
  return {
    userPrompt: entry.userPrompt,
    enhancedPrompt: typeof entry.enhancedPrompt === "string" ? entry.enhancedPrompt : "",
    generatedCode: typeof entry.generatedCode === "string" ? entry.generatedCode : "",
    projectType: typeof entry.projectType === "string" ? entry.projectType : "",
    languageKey: typeof entry.languageKey === "string" ? entry.languageKey : "",
    finalLanguage: typeof entry.finalLanguage === "string" ? entry.finalLanguage : "",
    timestamp: typeof entry.timestamp === "string" ? entry.timestamp : "",
  };
}

function loadHistoryFromStorage() {
  if (typeof localStorage === "undefined") return [];

  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => normalizeHistoryEntry(entry))
      .filter(Boolean)
      .slice(0, HISTORY_LIMIT);
  } catch (error) {
    return [];
  }
}

function saveHistoryToStorage(entries) {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    return;
  }
}

function setHistoryDropdownOpen(isOpen) {
  if (!historyDropdown || !historyToggle) return;
  historyDropdownOpen = isOpen;
  historyDropdown.classList.toggle("is-open", isOpen);
  historyDropdown.setAttribute("aria-hidden", String(!isOpen));
  historyToggle.setAttribute("aria-expanded", String(isOpen));
}

function closeHistoryDropdown() {
  if (!historyDropdownOpen) return;
  setHistoryDropdownOpen(false);
}

function toggleHistoryDropdown() {
  setHistoryDropdownOpen(!historyDropdownOpen);
}

function setHistoryEmptyState(isEmpty) {
  if (historyEmpty) {
    historyEmpty.classList.toggle("is-hidden", !isEmpty);
  }
}

function renderHistoryList() {
  if (!historyList) return;

  historyList.innerHTML = "";
  const hasEntries = Array.isArray(historyEntries) && historyEntries.length > 0;
  setHistoryEmptyState(!hasEntries);

  if (clearHistoryBtn) {
    clearHistoryBtn.disabled = !hasEntries;
  }

  if (!hasEntries) return;

  historyEntries.forEach((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.dataset.index = String(index);
    button.style.setProperty("--delay", Math.min(index * 45, 240) + "ms");
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-label", "Load generation: " + (entry.userPrompt || "Untitled prompt"));

    if (entry.userPrompt === activeHistoryPrompt) {
      button.classList.add("is-active");
    }

    const icon = document.createElement("span");
    icon.className = "history-icon";
    icon.textContent = "📄";

    const title = document.createElement("span");
    title.className = "history-title-text";
    title.textContent = entry.userPrompt || "Untitled prompt";

    button.appendChild(icon);
    button.appendChild(title);
    historyList.appendChild(button);
  });

  initMagneticButtons(historyList);
}

function upsertHistoryEntry(entry) {
  if (!entry || !entry.userPrompt) return;
  const promptKey = normalizePromptKey(entry.userPrompt);
  if (!promptKey) return;

  const existingIndex = historyEntries.findIndex(
    (item) => normalizePromptKey(item.userPrompt) === promptKey
  );

  if (existingIndex !== -1) {
    historyEntries.splice(existingIndex, 1);
  }

  const storedEntry = {
    userPrompt: entry.userPrompt,
    enhancedPrompt: entry.enhancedPrompt || "",
    generatedCode: entry.generatedCode || "",
    projectType: entry.projectType || "",
    languageKey: entry.languageKey || "",
    finalLanguage: entry.finalLanguage || "",
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  historyEntries.unshift(storedEntry);
  if (historyEntries.length > HISTORY_LIMIT) {
    historyEntries.length = HISTORY_LIMIT;
  }

  saveHistoryToStorage(historyEntries);
  activeHistoryPrompt = storedEntry.userPrompt;
  renderHistoryList();
}

function restoreHistoryEntry(entry) {
  if (!entry) return;

  const projectType = entry.projectType || "";
  const languageKey = entry.languageKey || (projectType === "frontend" ? FRONTEND_LANGUAGE_KEY : "");
  const languageMeta = LANGUAGE_CATALOG[languageKey];
  const displayLanguage =
    entry.finalLanguage || (languageMeta ? languageMeta.prompt_name : languageKey);
  const enhancedText = entry.enhancedPrompt || "No enhanced prompt returned.";
  const codeText = entry.generatedCode || "No generated code returned.";
  const prismLang = languageMeta ? languageMeta.prism_name : "python";
  const projectLabel = getProjectTypeLabel(projectType);

  if (promptInput) {
    promptInput.value = entry.userPrompt || "";
  }

  projectTypeInputs.forEach((input) => {
    input.checked = input.value === projectType;
  });

  updateProjectTypeUI();

  if (projectType === "dsa" && dsaLanguageSelect) {
    dsaLanguageSelect.value = languageKey || "";
    const selectedLanguage = dsaLanguageSelect.value;
    if (selectedLanguage) {
      handleLanguageSelection(dsaLanguageSelect);
      triggerLanguageMarquee(selectedLanguage);
    } else {
      const placeholder = dsaLanguageSelect.querySelector("option[data-placeholder='true']");
      if (placeholder) {
        placeholder.hidden = false;
      }
      dsaLanguageSelect.classList.add("has-placeholder");
    }
  }

  if (projectType === "backend" && backendLanguageSelect) {
    backendLanguageSelect.value = languageKey || "";
    const selectedLanguage = backendLanguageSelect.value;
    if (selectedLanguage) {
      handleLanguageSelection(backendLanguageSelect);
      triggerLanguageMarquee(selectedLanguage);
    } else {
      const placeholder = backendLanguageSelect.querySelector("option[data-placeholder='true']");
      if (placeholder) {
        placeholder.hidden = false;
      }
      backendLanguageSelect.classList.add("has-placeholder");
    }
  }

  renderPromptEngineering(enhancedText, {
    language: displayLanguage,
    mode: "Moderate",
    category: projectLabel,
  });

  setCodeBlock(editorPre, generatedCode, codeText, prismLang);
  setCodeBlock(fullscreenPre, fullscreenCode, codeText, prismLang);
  updateEditorLabels(languageMeta, displayLanguage);
  updateLivePreviewState(languageKey, codeText);

  if (errorText) {
    errorText.textContent = "";
  }

  if (autoTabTimeout) {
    clearTimeout(autoTabTimeout);
    autoTabTimeout = null;
  }

  smoothScrollToSection(outputSection);
  setActiveTab("prompt-panel");

  activeHistoryPrompt = entry.userPrompt || "";
  renderHistoryList();
}

function handleHistoryClick(event) {
  const target = event.target.closest(".history-item");
  if (!target || !historyList) return;
  if (!historyList.contains(target)) return;
  const index = Number(target.dataset.index);
  const entry = historyEntries[index];
  if (!entry) return;
  restoreHistoryEntry(entry);
  closeHistoryDropdown();
}

function clearHistory() {
  historyEntries = [];
  activeHistoryPrompt = "";
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
    }
  }
  renderHistoryList();
}

function initHistory() {
  historyEntries = loadHistoryFromStorage();
  renderHistoryList();

  if (historyList) {
    historyList.addEventListener("click", handleHistoryClick);
  }

  if (historyToggle && historyDropdown) {
    historyToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleHistoryDropdown();
    });
  }

  document.addEventListener("click", (event) => {
    if (!historyDropdownOpen || !historyMenu) return;
    if (historyMenu.contains(event.target)) return;
    closeHistoryDropdown();
  });

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      if (!historyEntries.length) return;
      const confirmed = window.confirm("Clear recent generations?");
      if (!confirmed) return;
      clearHistory();
    });
  }
}

function applyCodeTheme(theme) {
  const isDark = theme === "dark";

  if (prismThemeDark && prismThemeLight) {
    prismThemeDark.disabled = !isDark;
    prismThemeLight.disabled = isDark;
  }

  if (editorShell) {
    editorShell.classList.toggle("theme-dark", isDark);
    editorShell.classList.toggle("theme-light", !isDark);
  }

  if (editorModalContent) {
    editorModalContent.classList.toggle("theme-dark", isDark);
    editorModalContent.classList.toggle("theme-light", !isDark);
  }

  if (toggleThemeBtn) {
    toggleThemeBtn.textContent = isDark ? "Light" : "Dark";
    toggleThemeBtn.setAttribute("aria-pressed", String(!isDark));
    toggleThemeBtn.setAttribute(
      "aria-label",
      isDark ? "Switch code theme to light" : "Switch code theme to dark"
    );
  }

  if (window.Prism) {
    if (generatedCode && generatedCode.textContent && generatedCode.textContent.trim()) {
      Prism.highlightElement(generatedCode);
    }
    if (fullscreenCode && fullscreenCode.textContent && fullscreenCode.textContent.trim()) {
      Prism.highlightElement(fullscreenCode);
    }
  }
}

function toggleCodeTheme() {
  codeTheme = codeTheme === "dark" ? "light" : "dark";
  applyCodeTheme(codeTheme);
}

function runTypewriterOnce() {
  if (!appSubtitle) return;

  const text = appSubtitle.dataset.text || "";
  appSubtitle.textContent = "";

  let index = 0;
  const timer = setInterval(() => {
    index += 1;
    appSubtitle.textContent = text.slice(0, index);

    if (index >= text.length) {
      clearInterval(timer);
      appSubtitle.classList.add("is-typed");
    }
  }, 28);
}

function formatMarqueeLanguage(language) {
  const trimmed = (language || "").trim();
  if (!trimmed) return "";
  if (trimmed === "HTML + CSS + JavaScript") return "HTML/CSS/JS";
  return trimmed;
}

function getLanguageAccent(language) {
  const normalized = (language || "").trim().toLowerCase();
  const key = normalized === "html + css + javascript" ? "html/css/js" : normalized;
  return (
    LANGUAGE_ACCENTS[key] ||
    { color: "rgba(92, 255, 173, 0.7)", glow: "rgba(92, 255, 173, 0.35)" }
  );
}

function triggerLanguageMarquee(language) {
  if (!languageMarquee || !language) return;
  const displayText = formatMarqueeLanguage(language);
  if (!displayText) return;
  const accent = getLanguageAccent(displayText);
  languageMarquee.style.setProperty("--accent-color", accent.color);
  languageMarquee.style.setProperty("--accent-glow", accent.glow);
  languageMarquee.textContent = "⚡ Language: " + displayText;
  languageMarquee.classList.remove("run");
  void languageMarquee.offsetWidth;
  languageMarquee.classList.add("run");
}

function smoothScrollToSection(sectionElement) {
  if (!sectionElement) return;
  sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getSelectedProjectType() {
  const selected = document.querySelector("input[name='projectType']:checked");
  return selected ? selected.value : "";
}

function setGroupVisibility(element, isVisible) {
  if (!element) return;
  element.classList.toggle("is-hidden", !isVisible);
  element.setAttribute("aria-hidden", String(!isVisible));
}

function buildLanguageSelect(selectElement, options, placeholderText) {
  if (!selectElement) return;
  selectElement.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = placeholderText;
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.hidden = false;
  placeholder.dataset.placeholder = "true";
  selectElement.appendChild(placeholder);

  options.forEach((languageName) => {
    const option = document.createElement("option");
    option.value = languageName;
    option.textContent = languageName;
    selectElement.appendChild(option);
  });

  selectElement.value = "";
  selectElement.classList.add("has-placeholder");
}

function handleLanguageSelection(selectElement) {
  if (!selectElement) return;
  const placeholder = selectElement.querySelector("option[data-placeholder='true']");
  if (selectElement.value && placeholder) {
    placeholder.hidden = true;
    selectElement.classList.remove("has-placeholder");
  }
}

function updateProjectTypeUI() {
  const projectType = getSelectedProjectType();

  setGroupVisibility(dsaLanguageGroup, projectType === "dsa");
  setGroupVisibility(backendLanguageGroup, projectType === "backend");
  setGroupVisibility(frontendNote, projectType === "frontend");

  if (projectType === "frontend") {
    triggerLanguageMarquee("HTML + CSS + JavaScript");
  }
}

function getSelectedLanguageKey(projectType) {
  if (projectType === "dsa") {
    return dsaLanguageSelect ? dsaLanguageSelect.value : "";
  }
  if (projectType === "backend") {
    return backendLanguageSelect ? backendLanguageSelect.value : "";
  }
  if (projectType === "frontend") {
    return FRONTEND_LANGUAGE_KEY;
  }
  return "";
}

function updateTabIndicator() {
  if (!tabIndicator || !tabButtons.length) return;
  const activeButton = document.querySelector(".tab-btn.is-active");
  if (!activeButton) return;
  const parentRect = activeButton.parentElement.getBoundingClientRect();
  const rect = activeButton.getBoundingClientRect();
  const left = rect.left - parentRect.left;
  tabIndicator.style.width = rect.width + "px";
  tabIndicator.style.transform = "translateX(" + left + "px)";
}

function setActiveTab(tabId, options = {}) {
  const targetId = tabId || "prompt-panel";

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === targetId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  if (promptPanel) {
    promptPanel.classList.toggle("is-active", targetId === "prompt-panel");
  }
  if (codePanel) {
    codePanel.classList.toggle("is-active", targetId === "code-panel");
  }

  if (!options.skipIndicator) {
    requestAnimationFrame(updateTabIndicator);
  }
}

function generateLineNumberRows(preElement) {
  if (!preElement) return;
  const codeEl = preElement.querySelector("code");
  if (!codeEl) return;

  const editorBody = preElement.closest(".editor-body");
  if (!editorBody) return;

  const gutter = editorBody.querySelector(".editor-gutter .line-numbers");
  if (!gutter) return;

  gutter.innerHTML = "";

  const text = codeEl.textContent || "";
  const lineCount = text.split("\n").length;
  if (lineCount < 1) return;

  for (let i = 1; i <= lineCount; i++) {
    const span = document.createElement("span");
    span.textContent = i;
    gutter.appendChild(span);
  }
}

function refreshLineNumbers(preElement) {
  generateLineNumberRows(preElement);
}

function syncLineNumberScroll(preElement) {
  if (!preElement) return;
  const editorBody = preElement.closest(".editor-body");
  if (!editorBody) return;
  const gutter = editorBody.querySelector(".editor-gutter");
  if (gutter) {
    gutter.scrollTop = preElement.scrollTop;
  }
}

function bindLineNumberScroll(preElement) {
  if (!preElement) return;
  const handler = () => syncLineNumberScroll(preElement);
  preElement.addEventListener("scroll", handler, { passive: true });
  handler();
}

function setCodeBlock(preElement, codeElement, codeText, prismLang) {
  if (!codeElement) return;
  codeElement.className = `language-${prismLang}`;
  codeElement.textContent = codeText;
  if (window.Prism) {
    Prism.highlightElement(codeElement);
  }

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      generateLineNumberRows(preElement);
      syncLineNumberScroll(preElement);
    });
  } else {
    generateLineNumberRows(preElement);
    syncLineNumberScroll(preElement);
  }
}


function clearPromptCards() {
  if (promptSummary) promptSummary.textContent = "No data yet.";
  if (promptMeta) promptMeta.innerHTML = "";
  [
    promptFeatures,
    promptArchitecture,
    promptImplementation,
    promptConstraints,
  ].forEach((list) => {
    if (list) list.innerHTML = "";
  });
  if (promptRaw) promptRaw.textContent = "No data yet.";
}

function parseEnhancedPrompt(text) {
  const sections = {
    summary: "",
    features: [],
    implementation: [],
    uiux: [],
    data: [],
    constraints: [],
    other: [],
  };

  const lines = (text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let current = "";

  lines.forEach((line) => {
    if (line.endsWith(":")) {
      current = line.slice(0, -1).toLowerCase();
      return;
    }

    const cleaned = line.replace(/^[-*]\s*/, "");

    if (!sections.summary && /^(build|create|generate)\b/i.test(cleaned)) {
      sections.summary = cleaned;
      return;
    }

    if (current === "features") {
      sections.features.push(cleaned);
    } else if (current === "implementation") {
      sections.implementation.push(cleaned);
    } else if (current === "ui/ux" || current === "uiux") {
      sections.uiux.push(cleaned);
    } else if (current === "data/logic" || current === "data") {
      sections.data.push(cleaned);
    } else if (current === "constraints") {
      sections.constraints.push(cleaned);
    } else if (!sections.summary) {
      sections.summary = cleaned;
    } else {
      sections.other.push(cleaned);
    }
  });

  return sections;
}

function appendKeywordSpan(parent, text) {
  const span = document.createElement("span");
  span.className = "keyword";
  span.textContent = text;
  parent.appendChild(span);
}

function buildPromptListItem(text) {
  const item = document.createElement("li");
  const match = text.match(/^([^:]{2,40}):\s*(.+)$/);
  if (match) {
    appendKeywordSpan(item, match[1]);
    item.appendChild(document.createTextNode(": " + match[2]));
    return item;
  }

  item.textContent = text;
  return item;
}

function fillPromptList(listElement, items) {
  if (!listElement) return;
  listElement.innerHTML = "";
  items.forEach((item) => {
    listElement.appendChild(buildPromptListItem(item));
  });
}

function togglePromptCard(card, items) {
  if (!card) return;
  card.classList.toggle("is-hidden", !items || items.length === 0);
}

function renderPromptEngineering(text, meta) {
  const sections = parseEnhancedPrompt(text);
  const summary = sections.summary || "Enhanced prompt ready.";
  if (promptSummary) {
    promptSummary.textContent = summary;
  }

  const features = sections.features.length ? sections.features : sections.other.slice(0, 6);
  if (!features.length) {
    features.push("Core features inferred from user intent");
  }

  const architecture = sections.implementation.length
    ? sections.implementation
    : sections.other.slice(0, 4);
  if (!architecture.length) {
    architecture.push("Clean modular structure aligned to the request");
  }

  const implementation = [...sections.uiux, ...sections.data].filter(Boolean);
  if (!implementation.length) {
    implementation.push("Implementation goals refined from inferred scope");
  }

  const constraints = sections.constraints.length
    ? sections.constraints
    : ["Return complete runnable code only"];

  fillPromptList(promptFeatures, features);
  fillPromptList(promptArchitecture, architecture);
  fillPromptList(promptImplementation, implementation);
  fillPromptList(promptConstraints, constraints);

  togglePromptCard(promptFeaturesCard, features);
  togglePromptCard(promptArchitectureCard, architecture);
  togglePromptCard(promptImplementationCard, implementation);
  togglePromptCard(promptConstraintsCard, constraints);

  if (promptRaw) {
    promptRaw.textContent = text || "No enhanced prompt returned.";
  }

  if (promptMeta) {
    promptMeta.innerHTML = "";
    const chips = [];
    if (meta && meta.language) {
      chips.push(`Language: ${meta.language}`);
    }
    if (meta && meta.mode) {
      chips.push(`Mode: ${meta.mode}`);
    }
    if (meta && meta.category) {
      chips.push(meta.category);
    }
    chips.forEach((label) => {
      const chip = document.createElement("span");
      chip.className = "prompt-chip";
      chip.textContent = label;
      promptMeta.appendChild(chip);
    });
  }
}

function isPreviewable(languageKey, codeText) {
  if (languageKey === "HTML with inline CSS and JavaScript") return true;
  if (!codeText) return false;
  return /<html[\s>]/i.test(codeText) || /<!doctype\s+html/i.test(codeText);
}

function updateEditorLabels(languageMeta, finalLanguage) {
  const displayLanguage = finalLanguage || (languageMeta ? languageMeta.prompt_name : "Language");
  if (languageBadge) {
    languageBadge.textContent = displayLanguage;
  }
  if (fullscreenLanguageBadge) {
    fullscreenLanguageBadge.textContent = displayLanguage;
  }

  const fileText = languageMeta ? languageMeta.file_label : "main.txt";
  if (fileLabel) {
    fileLabel.textContent = fileText;
  }
  if (fullscreenFileLabel) {
    fullscreenFileLabel.textContent = fileText;
  }
}

function buildLanguageOptions() {
  buildLanguageSelect(dsaLanguageSelect, DSA_LANGUAGES, "Select Language");
  buildLanguageSelect(backendLanguageSelect, BACKEND_LANGUAGES, "Select Backend Language");
}

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

function isScrollAllowedTarget(target) {
  if (!target) return false;
  return Boolean(
    target.closest(".editor-pre") ||
      target.closest(".prompt-scroll") ||
      target.closest(".prompt-raw")
  );
}

function disableManualScroll() {
  if (!pageScroll) return;

  const blockScroll = (event) => {
    if (isScrollAllowedTarget(event.target)) {
      return;
    }
    event.preventDefault();
  };

  pageScroll.addEventListener("wheel", blockScroll, { passive: false });
  pageScroll.addEventListener("touchmove", blockScroll, { passive: false });

  window.addEventListener(
    "keydown",
    (event) => {
      if (!SCROLL_KEYS.has(event.key)) return;
      if (isEditableTarget(event.target)) return;
      if (isScrollAllowedTarget(document.activeElement)) return;
      event.preventDefault();
    },
    { passive: false }
  );
}

function initSectionReveal() {
  const sections = document.querySelectorAll(".page-section");
  if (!sections.length) return;

  sections.forEach((section, index) => {
    section.classList.add("reveal-ready");
    if (index === 0) {
      section.classList.add("in-view");
    }
  });

  const scrollRoot = document.querySelector(".page-scroll");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.28) {
          entry.target.classList.add("in-view");
        } else {
          entry.target.classList.remove("in-view");
        }
      });
    },
    {
      root: scrollRoot,
      threshold: [0.28, 0.55, 0.8],
      rootMargin: "0px 0px -8% 0px",
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function initCursorTrail() {
  if (!cursorGlow || !cursorDot) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (prefersReducedMotion || coarsePointer) return;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let glowX = targetX;
  let glowY = targetY;
  let dotX = targetX;
  let dotY = targetY;
  let cursorEnabled = false;

  const animate = () => {
    dotX += (targetX - dotX) * 0.32;
    dotY += (targetY - dotY) * 0.32;
    glowX += (targetX - glowX) * 0.14;
    glowY += (targetY - glowY) * 0.14;

    cursorDot.style.transform = "translate3d(" + (dotX - 3.5) + "px, " + (dotY - 3.5) + "px, 0)";
    cursorGlow.style.transform =
      "translate3d(" + (glowX - 18) + "px, " + (glowY - 18) + "px, 0)";

    requestAnimationFrame(animate);
  };

  window.addEventListener(
    "mousemove",
    (event) => {
      targetX = event.clientX;
      targetY = event.clientY;

      if (!cursorEnabled) {
        cursorEnabled = true;
        document.body.classList.add("cursor-active");
      }
    },
    { passive: true }
  );

  document.addEventListener("mouseleave", () => {
    cursorEnabled = false;
    document.body.classList.remove("cursor-active");
  });

  window.addEventListener("blur", () => {
    cursorEnabled = false;
    document.body.classList.remove("cursor-active");
  });

  requestAnimationFrame(animate);
}

function initMagneticButtons(root = document) {
  const buttons = root.querySelectorAll("button");
  if (!buttons.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (prefersReducedMotion || coarsePointer) return;

  const maxOffset = 12;

  buttons.forEach((button) => {
    if (button.dataset.magnetic === "true") return;
    button.dataset.magnetic = "true";
    const reset = () => {
      button.classList.remove("is-pulsing", "is-pressed");
      button.style.setProperty("--mx", "0px");
      button.style.setProperty("--my", "0px");
    };

    button.addEventListener("mouseenter", () => {
      button.classList.add("is-pulsing");
    });

    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

      const moveX = (offsetX * maxOffset * 2).toFixed(2);
      const moveY = (offsetY * maxOffset * 2).toFixed(2);

      button.style.setProperty("--mx", moveX + "px");
      button.style.setProperty("--my", moveY + "px");
    });

    button.addEventListener("mouseleave", reset);
    button.addEventListener("pointercancel", () => button.classList.remove("is-pressed"));
    button.addEventListener("pointerdown", () => button.classList.add("is-pressed"));
    button.addEventListener("pointerup", () => button.classList.remove("is-pressed"));
  });
}

function initParticleField() {
  if (!particleCanvas) return;

  const context = particleCanvas.getContext("2d");
  if (!context) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let particles = [];

  const createParticle = () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.26,
    vy: (Math.random() - 0.5) * 0.26,
    radius: Math.random() * 1.5 + 0.45,
    alpha: Math.random() * 0.45 + 0.14,
  });

  const rebuildParticles = () => {
    const count = Math.max(18, Math.min(48, Math.floor((width * height) / 42000)));
    particles = Array.from({ length: count }, createParticle);
  };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;

    particleCanvas.width = Math.floor(width * dpr);
    particleCanvas.height = Math.floor(height * dpr);
    particleCanvas.style.width = width + "px";
    particleCanvas.style.height = height + "px";

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuildParticles();
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -16) particle.x = width + 16;
      if (particle.x > width + 16) particle.x = -16;
      if (particle.y < -16) particle.y = height + 16;
      if (particle.y > height + 16) particle.y = -16;

      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = "rgba(147, 207, 255, " + particle.alpha + ")";
      context.fill();
    });

    requestAnimationFrame(draw);
  };

  resize();
  draw();

  window.addEventListener("resize", resize, { passive: true });
}

function getProjectTypeLabel(projectType) {
  return PROJECT_TYPE_LABELS[projectType] || "Project";
}

function openEditorFullscreen() {
  if (!editorModal || !fullscreenCode || !generatedCode) return;
  if (!generatedCode.textContent || generatedCode.textContent === "No data yet.") {
    return;
  }

  if (fullscreenCode.textContent !== generatedCode.textContent) {
    const prismLang = generatedCode.className.replace("language-", "") || "python";
    setCodeBlock(fullscreenPre, fullscreenCode, generatedCode.textContent, prismLang);
  } else {
    refreshLineNumbers(fullscreenPre);
    syncLineNumberScroll(fullscreenPre);
  }

  editorModal.classList.add("is-open");
  editorModal.setAttribute("aria-hidden", "false");
}

function closeEditorFullscreen() {
  if (!editorModal) return;
  editorModal.classList.remove("is-open");
  editorModal.setAttribute("aria-hidden", "true");
}

function openPreview() {
  if (!previewModal || !previewFrame || !generatedCode) return;
  const codeText = generatedCode.textContent || "";
  if (!codeText.trim() || codeText === "No data yet.") return;

  previewFrame.srcdoc = codeText;
  previewModal.classList.add("is-open");
  previewModal.setAttribute("aria-hidden", "false");
}

function closePreview() {
  if (!previewModal || !previewFrame) return;
  previewFrame.srcdoc = "";
  previewModal.classList.remove("is-open");
  previewModal.setAttribute("aria-hidden", "true");
}

function updateLivePreviewState(languageKey, codeText) {
  if (!livePreviewBtn) return;
  const available = isPreviewable(languageKey, codeText);
  livePreviewBtn.classList.toggle("is-hidden", !available);
  livePreviewBtn.disabled = !available;
}

function lockInputControls() {
  isGenerating = true;
  if (promptInput) promptInput.readOnly = true;
  projectTypeInputs.forEach((input) => { input.disabled = true; });
  if (dsaLanguageSelect) dsaLanguageSelect.disabled = true;
  if (backendLanguageSelect) backendLanguageSelect.disabled = true;
  generateBtn.disabled = true;
  const inputShell = document.querySelector(".input-shell");
  if (inputShell) inputShell.classList.add("is-generating");
}

function unlockInputControls() {
  isGenerating = false;
  if (promptInput) promptInput.readOnly = false;
  projectTypeInputs.forEach((input) => { input.disabled = false; });
  if (dsaLanguageSelect) dsaLanguageSelect.disabled = false;
  if (backendLanguageSelect) backendLanguageSelect.disabled = false;
  generateBtn.disabled = false;
  const inputShell = document.querySelector(".input-shell");
  if (inputShell) inputShell.classList.remove("is-generating");
}

/* ── Pipeline Status Helpers ── */

const PIPELINE_STAGES = ["analyzing", "enhancing", "generating", "finalizing"];
const pipelineEl = document.getElementById("pipelineStatus");

function showPipeline() {
  if (pipelineEl) pipelineEl.classList.add("is-active");
}

function hidePipeline() {
  if (pipelineEl) pipelineEl.classList.remove("is-active");
}

function resetPipeline() {
  if (!pipelineEl) return;
  pipelineEl.querySelectorAll(".pipeline-stage").forEach((el) => {
    el.classList.remove("active", "completed", "failed");
  });
  const doneLabel = pipelineEl.querySelector(".pipeline-done-label");
  if (doneLabel) {
    doneLabel.classList.remove("is-visible");
    doneLabel.textContent = "";
  }
  const statsWrapper = document.querySelector(".stats-wrapper");
  if (statsWrapper) statsWrapper.classList.remove("is-visible");
  const popover = document.getElementById("timingPopover");
  if (popover) popover.classList.remove("is-open");
}

function setPipelineStage(activeStage) {
  if (!pipelineEl) return;
  const idx = PIPELINE_STAGES.indexOf(activeStage);
  if (idx === -1) return;

  PIPELINE_STAGES.forEach((stage, i) => {
    const el = pipelineEl.querySelector(`[data-stage="${stage}"]`);
    if (!el) return;
    el.classList.remove("active", "completed", "failed");
    if (i < idx) {
      el.classList.add("completed");
    } else if (i === idx) {
      el.classList.add("active");
    }
  });
}

function setPipelineFailed(failedStage) {
  if (!pipelineEl) return;
  const idx = PIPELINE_STAGES.indexOf(failedStage);

  PIPELINE_STAGES.forEach((stage, i) => {
    const el = pipelineEl.querySelector(`[data-stage="${stage}"]`);
    if (!el) return;
    el.classList.remove("active", "completed", "failed");
    if (i < idx) {
      el.classList.add("completed");
    } else if (i === idx) {
      el.classList.add("failed");
    }
  });
}

function setPipelineDone(timings) {
  if (!pipelineEl) return;
  PIPELINE_STAGES.forEach((stage) => {
    const el = pipelineEl.querySelector(`[data-stage="${stage}"]`);
    if (!el) return;
    el.classList.remove("active", "failed");
    el.classList.add("completed");
  });
  const doneLabel = pipelineEl.querySelector(".pipeline-done-label");
  if (doneLabel) {
    doneLabel.textContent = "✓ DONE";
    doneLabel.classList.add("is-visible");
  }

  /* Show Stats button if backend provided timings */
  const statsWrapper = document.querySelector(".stats-wrapper");
  if (statsWrapper && timings && typeof timings.total === "number") {
    const enhEl = document.getElementById("timingEnhancement");
    const genEl = document.getElementById("timingGeneration");
    const totalEl = document.getElementById("timingTotal");
    if (enhEl) enhEl.textContent = timings.enhancement.toFixed(2) + " s";
    if (genEl) genEl.textContent = timings.generation.toFixed(2) + " s";
    if (totalEl) totalEl.textContent = timings.total.toFixed(2) + " s";
    statsWrapper.classList.add("is-visible");
  }
}

async function generateCode() {
  if (isGenerating) return;

  const prompt = promptInput.value.trim();
  const projectType = getSelectedProjectType();
  const languageKey = getSelectedLanguageKey(projectType);
  const languageMeta = LANGUAGE_CATALOG[languageKey];
  const language = languageMeta ? languageMeta.prompt_name : languageKey;
  errorText.textContent = "";

  if (!prompt) {
    errorText.textContent = "Please enter a prompt.";
    return;
  }

  if (!projectType) {
    errorText.textContent = "Please select a project type.";
    return;
  }

  if (projectType === "dsa" && !languageKey) {
    errorText.textContent = "Please select a programming language.";
    return;
  }

  if (projectType === "backend" && !languageKey) {
    errorText.textContent = "Please select a backend language.";
    return;
  }

  lockInputControls();
  resetPipeline();
  showPipeline();
  
  generationCounter += 1;
  const currentGeneration = generationCounter;
  if (autoTabTimeout) {
    clearTimeout(autoTabTimeout);
  }

  let lastActiveStage = "analyzing";
  let generationSuccess = false;

  try {
    const response = await fetch(API_BASE + "/generate-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, language, project_type: projectType }),
    });

    if (!response.ok) {
      throw new Error("Server returned " + response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let resultData = null;
    let streamError = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        let event;
        try {
          event = JSON.parse(jsonStr);
        } catch {
          continue;
        }

        const stage = event.stage;

        if (stage === "error") {
          streamError = event.error || "Something went wrong.";
          setPipelineFailed(lastActiveStage);
          break;
        }

        if (stage === "done") {
          resultData = event.data;
          setPipelineDone(resultData && resultData.timings);
          break;
        }

        if (PIPELINE_STAGES.includes(stage)) {
          lastActiveStage = stage;
          setPipelineStage(stage);
        }
      }

      if (resultData || streamError) break;
    }

    if (streamError) {
      throw new Error(streamError);
    }

    if (!resultData) {
      throw new Error("No result received from server.");
    }

    const enhancedText = resultData.enhanced_prompt || "No enhanced prompt returned.";
    const codeText = resultData.generated_code || "No generated code returned.";
    const prismLang = languageMeta ? languageMeta.prism_name : "python";
    const finalLanguage = resultData.final_language || language;
    const projectLabel = getProjectTypeLabel(projectType);

    renderPromptEngineering(enhancedText, {
      language: finalLanguage,
      mode: "Moderate",
      category: projectLabel,
    });

    setCodeBlock(editorPre, generatedCode, codeText, prismLang);
    setCodeBlock(fullscreenPre, fullscreenCode, codeText, prismLang);
    updateEditorLabels(languageMeta, finalLanguage);
    updateLivePreviewState(languageKey, codeText);

    upsertHistoryEntry({
      userPrompt: prompt,
      enhancedPrompt: enhancedText,
      generatedCode: codeText,
      projectType,
      languageKey,
      finalLanguage,
      timestamp: new Date().toISOString(),
    });

    generationSuccess = true;

    smoothScrollToSection(outputSection);
    setActiveTab("prompt-panel");
    autoTabTimeout = setTimeout(() => {
      if (currentGeneration === generationCounter && generationSuccess) {
        setActiveTab("code-panel");
      }
    }, 1400);
  } catch (error) {
    errorText.textContent = error.message || "Something went wrong.";
    clearPromptCards();
    if (!pipelineEl || !pipelineEl.querySelector(".pipeline-stage.failed")) {
      setPipelineFailed(lastActiveStage);
    }
  } finally {
    unlockInputControls();
  }
}

function initApp() {
  generateBtn.addEventListener("click", generateCode);

  // Start button: smooth scroll to input section
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      smoothScrollToSection(inputSection);
    });
  }

  if (homeBtnInput) {
    homeBtnInput.addEventListener("click", () => {
      smoothScrollToSection(heroSection);
    });
  }

  if (homeBtnOutput) {
    homeBtnOutput.addEventListener("click", () => {
      smoothScrollToSection(heroSection);
    });
  }

  if (modifyInputBtn) {
    modifyInputBtn.addEventListener("click", () => {
      smoothScrollToSection(inputSection);
    });
  }

  /* Stats popover: click to toggle, click outside to close */
  const timingInfoBtn = document.getElementById("timingInfoBtn");
  const timingPopover = document.getElementById("timingPopover");
  if (timingInfoBtn && timingPopover) {
    timingInfoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      timingPopover.classList.toggle("is-open");
    });
    timingPopover.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    document.addEventListener("click", () => {
      timingPopover.classList.remove("is-open");
    });
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
    });
  });

  window.addEventListener("resize", updateTabIndicator);
  window.addEventListener("resize", () => {
    refreshLineNumbers(editorPre);
    refreshLineNumbers(fullscreenPre);
  });

  projectTypeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (isGenerating) return;
      updateProjectTypeUI();
    });
  });

  if (dsaLanguageSelect) {
    dsaLanguageSelect.addEventListener("change", (event) => {
      handleLanguageSelection(dsaLanguageSelect);
      triggerLanguageMarquee(event.target.value);
    });
  }

  if (backendLanguageSelect) {
    backendLanguageSelect.addEventListener("change", (event) => {
      handleLanguageSelection(backendLanguageSelect);
      triggerLanguageMarquee(event.target.value);
    });
  }

  copyCodeBtn.addEventListener("click", async () => {
    const code = generatedCode.textContent || "";
    if (!code.trim() || code === "No data yet.") {
      errorText.textContent = "No code available to copy.";
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      const originalLabel = copyCodeBtn.textContent;
      copyCodeBtn.textContent = "Copied!";
      setTimeout(() => {
        copyCodeBtn.textContent = originalLabel || "Copy Code";
      }, 1500);
    } catch (error) {
      errorText.textContent = "Clipboard copy failed.";
    }
  });

  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener("click", toggleCodeTheme);
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", openEditorFullscreen);
  }

  if (fullscreenCloseBtn) {
    fullscreenCloseBtn.addEventListener("click", closeEditorFullscreen);
  }

  if (editorModal) {
    editorModal.addEventListener("click", (event) => {
      const target = event.target;
      if (target && target.dataset && target.dataset.close === "editor") {
        closeEditorFullscreen();
      }
    });
  }

  if (livePreviewBtn) {
    livePreviewBtn.addEventListener("click", openPreview);
  }

  if (previewCloseBtn) {
    previewCloseBtn.addEventListener("click", closePreview);
  }

  if (previewModal) {
    previewModal.addEventListener("click", (event) => {
      const target = event.target;
      if (target && target.dataset && target.dataset.close === "preview") {
        closePreview();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (historyDropdownOpen) {
      closeHistoryDropdown();
      return;
    }

    if (previewModal && previewModal.classList.contains("is-open")) {
      closePreview();
      return;
    }

    if (editorModal && editorModal.classList.contains("is-open")) {
      closeEditorFullscreen();
    }
  });

  applyCodeTheme(codeTheme);

  buildLanguageOptions();

  // Defensive: re-populate if selects are still empty
  if (dsaLanguageSelect && dsaLanguageSelect.options.length <= 1) {
    buildLanguageSelect(dsaLanguageSelect, DSA_LANGUAGES, "Select Language");
  }
  if (backendLanguageSelect && backendLanguageSelect.options.length <= 1) {
    buildLanguageSelect(backendLanguageSelect, BACKEND_LANGUAGES, "Select Backend Language");
  }

  updateProjectTypeUI();
  refreshLineNumbers(editorPre);
  refreshLineNumbers(fullscreenPre);
  bindLineNumberScroll(editorPre);
  bindLineNumberScroll(fullscreenPre);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      refreshLineNumbers(editorPre);
      refreshLineNumbers(fullscreenPre);
    });
  }
  setActiveTab("prompt-panel", { skipIndicator: true });
  requestAnimationFrame(updateTabIndicator);
  runTypewriterOnce();
  initSectionReveal();
  initCursorTrail();
  initHistory();
  initMagneticButtons();
  initParticleField();
  disableManualScroll();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

