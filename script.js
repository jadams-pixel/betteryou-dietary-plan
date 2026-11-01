/* ==========================================
   PERSPECTIVE WRITER
   Multi-perspective story writing app
   ========================================== */

const STORAGE_KEY = "dual_pov_notepad_state";
const MAX_PERSPECTIVES = 20;

let appState = {
  isConfigured: false,
  storyTitle: "A Tale of Two Perspectives",
  activePOV: "p1",

  characters: [
    {
      id: "p1",
      name: "Character 1",
      image: "",
      font: "'EB Garamond', serif",
      color: "#d97706",
      backstory: "Grew up in the coastal districts.",
      traits: "Calculated, observant, cautious.",
      secrets: "Hides a key in her locket.",
      motivations: "Seeking the truth of her past."
    },
    {
      id: "p2",
      name: "Character 2",
      image: "",
      font: "'Courier Prime', monospace",
      color: "#7c3aed",
      backstory: "Raised in the upper city elite.",
      traits: "Impulsive, enigmatic, fearless.",
      secrets: "Working under cover.",
      motivations: "Protecting his family."
    }
  ],

  chapters: [
    {
      id: 1,
      title: "Chapter 1",
      pages: [
        {
          id: 1,
          pov: "p1",
          content: "<p>The yellow lined paper feels familiar under my pen...</p>"
        }
      ]
    }
  ],

  activePageId: 1
};


/* ==========================================
   INITIALISATION & STORAGE
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  setupEditorListeners();

  if (appState.isConfigured) {
    showMainApp();
  } else {
    showOpeningScreen();
  }
});

function saveToStorage() {
  saveCurrentPageContent();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function loadFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      appState = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse app state", e);
    }
  }
}


/* ==========================================
   GENERAL HELPERS
   ========================================== */

function getCharacter(id) {
  return appState.characters.find(char => char.id === id) || appState.characters[0];
}

function createId() {
  return Date.now() + Math.floor(Math.random() * 10000);
}

function getCurrentPage() {
  for (const chapter of appState.chapters) {
    const page = chapter.pages.find(pg => pg.id === appState.activePageId);
    if (page) return page;
  }
  return null;
}

function getCurrentChapter() {
  for (const chapter of appState.chapters) {
    if (chapter.pages.some(pg => pg.id === appState.activePageId)) {
      return chapter;
    }
  }
  return appState.chapters[appState.chapters.length - 1];
}

function getEditor() {
  return document.getElementById("editor");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}


/* ==========================================
   OPENING SCREEN AND MAIN APP
   ========================================== */

function showOpeningScreen() {
  document.getElementById("opening-screen").style.display = "flex";
  document.getElementById("app-layout").style.display = "none";
}

function showMainApp() {
  document.getElementById("opening-screen").style.display = "none";
  document.getElementById("app-layout").style.display = "flex";
  applySetup();
  renderSidebar();
  renderPOVSwitcher();
  loadCurrentPage();
  saveToStorage();
}

function resetApp() {
  if (confirm("Are you sure you want to reset the app? All saved story progress will be cleared.")) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}


/* ==========================================
   SIDEBAR & OUTLINE
   ========================================== */

function toggleSidebar() {
  const drawer = document.getElementById("sidebar-drawer");
  const overlay = document.getElementById("sidebar-overlay");
  if (!drawer || !overlay) return;

  drawer.classList.toggle("open");
  overlay.classList.toggle("open");
}

function renderSidebar() {
  renderCharacterCards();
  renderPageTree();
}

function renderPageTree() {
  const treeContainer = document.getElementById("page-tree");
  if (!treeContainer) return;

  treeContainer.innerHTML = "";

  appState.chapters.forEach(chap => {
    const chapHead = document.createElement("div");
    chapHead.className = "chapter-heading";
    chapHead.textContent = chap.title;
    treeContainer.appendChild(chapHead);

    chap.pages.forEach((pg, index) => {
      const char = getCharacter(pg.pov);
      const pageItem = document.createElement("div");
      pageItem.className = "page-item" + (pg.id === appState.activePageId ? " active" : "");
      pageItem.onclick = () => switchPage(pg.id);

      pageItem.innerHTML = `
        <span>Page ${index + 1}</span>
        <span class="page-tag" style="color:${char.color}">${escapeHTML(char.name)}</span>
      `;
      treeContainer.appendChild(pageItem);
    });
  });
}

function promptAddChapter() {
  const title = prompt("Enter Chapter Title:", `Chapter ${appState.chapters.length + 1}`);
  if (!title) return;

  const newChapId = createId();
  const newPageId = createId();

  appState.chapters.push({
    id: newChapId,
    title: title,
    pages: [
      {
        id: newPageId,
        pov: appState.activePOV,
        content: "<p></p>"
      }
    ]
  });

  switchPage(newPageId);
}


/* ==========================================
   CHARACTER CARDS & MULTI-BOX PROFILE ZOOM
   ========================================== */

function renderCharacterCards() {
  const container = document.getElementById("active-perspectives-container");
  if (!container) return;

  container.innerHTML = "";

  appState.characters.forEach(char => {
    const card = document.createElement("div");
    card.className = "char-mini-card";

    if (char.id === appState.activePOV) {
      card.classList.add("active");
    }

    card.style.setProperty("--character-color", char.color);

    const avatar = char.image
      ? `<img src="${escapeHTML(char.image)}" alt="" class="char-avatar">`
      : `<div class="avatar-placeholder">${escapeHTML(char.name.substring(0, 2).toUpperCase())}</div>`;

    card.innerHTML = `
      <div class="char-info-left" onclick="setActivePOV('${char.id}'); toggleSidebar();">
        ${avatar}
        <div class="char-details">
          <strong>${escapeHTML(char.name)}</strong>
          <small>Switch POV</small>
        </div>
      </div>
      <button class="profile-zoom-hint" onclick="openCharacterProfile('${char.id}')" title="View Profile">🔍 Bio</button>
    `;

    container.appendChild(card);
  });
}

function openCharacterProfile(charId) {
  const char = getCharacter(charId);
  if (!char) return;

  const modalContent = document.getElementById("profile-modal-content");
  if (!modalContent) return;

  modalContent.style.setProperty("--profile-color", char.color);

  const avatar = char.image
    ? `<img src="${escapeHTML(char.image)}" alt="" class="profile-big-avatar">`
    : `<div class="profile-big-avatar avatar-placeholder" style="width:75px; height:75px; margin:0 auto 0.5rem; font-size:1.4rem;">${escapeHTML(char.name.substring(0, 2).toUpperCase())}</div>`;

  modalContent.innerHTML = `
    <div class="profile-header-center">
      ${avatar}
      <h2>${escapeHTML(char.name)}</h2>
      <p style="font-size:0.75rem; color:var(--text-muted);">Character Bio & Lore Cards</p>
    </div>

    <div class="profile-grid-boxes">
      <div class="bio-box-card box-rose">
        <label>Backstory</label>
        <textarea id="bio-backstory-${char.id}" class="bio-textarea" placeholder="Origin, history...">${escapeHTML(char.backstory || '')}</textarea>
      </div>

      <div class="bio-box-card box-amber">
        <label>Traits</label>
        <textarea id="bio-traits-${char.id}" class="bio-textarea" placeholder="Personality, habits...">${escapeHTML(char.traits || '')}</textarea>
      </div>

      <div class="bio-box-card box-indigo">
        <label>Secrets</label>
        <textarea id="bio-secrets-${char.id}" class="bio-textarea" placeholder="Hidden motivations...">${escapeHTML(char.secrets || '')}</textarea>
      </div>

      <div class="bio-box-card box-emerald">
        <label>Motivations</label>
        <textarea id="bio-motivations-${char.id}" class="bio-textarea" placeholder="Goals, desires...">${escapeHTML(char.motivations || '')}</textarea>
      </div>
    </div>

    <div class="modal-actions" style="margin-top: 1rem;">
      <button class="btn btn-primary" onclick="saveCharacterBio('${char.id}')">Save & Close</button>
    </div>
  `;

  document.getElementById("modal-profile").classList.add("open");
}

function saveCharacterBio(charId) {
  const char = getCharacter(charId);
  if (!char) return;

  char.backstory = document.getElementById(`bio-backstory-${charId}`).value;
  char.traits = document.getElementById(`bio-traits-${charId}`).value;
  char.secrets = document.getElementById(`bio-secrets-${charId}`).value;
  char.motivations = document.getElementById(`bio-motivations-${charId}`).value;

  saveToStorage();
  closeModal("modal-profile");
}


/* ==========================================
   POV SWITCHING & HEADER
   ========================================== */

function renderPOVSwitcher() {
  const container = document.getElementById("pov-switcher");
  if (!container) return;

  container.innerHTML = "";

  appState.characters.forEach(char => {
    const btn = document.createElement("button");
    btn.className = "pov-pill-btn" + (char.id === appState.activePOV ? " active" : "");
    btn.style.setProperty("--character-color", char.color);
    btn.textContent = char.name;
    btn.onclick = () => setActivePOV(char.id);
    container.appendChild(btn);
  });
}

function setActivePOV(povId) {
  saveCurrentPageContent();
  appState.activePOV = povId;

  const page = getCurrentPage();
  if (page) {
    page.pov = povId;
  }

  applySetup();
  renderPOVSwitcher();
  renderCharacterCards();
  renderPageTree();
  loadCurrentPage();
  saveToStorage();
}


/* ==========================================
   EDITOR & PAGE TURNING
   ========================================== */

function setupEditorListeners() {
  const editor = getEditor();
  if (!editor) return;

  editor.addEventListener("input", () => {
    updateWordCount();
  });
}

function saveCurrentPageContent() {
  const editor = getEditor();
  const page = getCurrentPage();
  if (editor && page) {
    page.content = editor.innerHTML;
  }
}

function loadCurrentPage() {
  const page = getCurrentPage();
  const editor = getEditor();
  if (!page || !editor) return;

  editor.innerHTML = page.content || "<p></p>";
  appState.activePOV = page.pov;

  const char = getCharacter(page.pov);
  document.body.setAttribute("data-pov", char.id);
  document.documentElement.style.setProperty("--active-accent", char.color);
  document.documentElement.style.setProperty("--active-font", char.font);

  // Update Corner Portrait & Badges
  const frame = document.getElementById("portrait-frame");
  const nameLabel = document.getElementById("portrait-name");
  const badge = document.getElementById("current-page-pov");

  if (frame) {
    frame.innerHTML = char.image
      ? `<img src="${escapeHTML(char.image)}" alt="">`
      : `<div class="avatar-placeholder">${escapeHTML(char.name.substring(0, 2).toUpperCase())}</div>`;
  }
  if (nameLabel) nameLabel.textContent = char.name;
  if (badge) {
    badge.textContent = `${char.name} POV`;
    badge.style.background = char.color;
  }

  // Set font selector dropdown to character's saved font
  const fontPicker = document.getElementById("active-font-picker");
  if (fontPicker) {
    fontPicker.value = char.font;
  }

  updateWordCount();
  renderPOVSwitcher();
}

function switchPage(pageId) {
  saveCurrentPageContent();
  appState.activePageId = pageId;
  const page = getCurrentPage();
  if (page) {
    appState.activePOV = page.pov;
  }
  loadCurrentPage();
  renderPageTree();
}

function turnPage() {
  saveCurrentPageContent();
  const sheet = document.getElementById("notepad-sheet-anim");
  if (sheet) sheet.classList.add("page-turn-anim");

  setTimeout(() => {
    const currentChap = getCurrentChapter();
    const currentPageIndex = currentChap.pages.findIndex(p => p.id === appState.activePageId);

    if (currentPageIndex < currentChap.pages.length - 1) {
      // Next page in current chapter
      appState.activePageId = currentChap.pages[currentPageIndex + 1].id;
    } else {
      // Add new page to chapter
      const newPageId = createId();
      currentChap.pages.push({
        id: newPageId,
        pov: appState.activePOV,
        content: "<p></p>"
      });
      appState.activePageId = newPageId;
    }

    loadCurrentPage();
    renderPageTree();

    if (sheet) sheet.classList.remove("page-turn-anim");
  }, 300);
}

function updateWordCount() {
  const editor = getEditor();
  if (!editor) return;

  const text = editor.innerText || "";
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const readTime = Math.ceil(words / 200);

  const statWords = document.getElementById("stat-words");
  const statRead = document.getElementById("stat-read");

  if (statWords) statWords.textContent = `${words} word${words === 1 ? "" : "s"}`;
  if (statRead) statRead.textContent = `${readTime} min read`;
}


/* ==========================================
   FORMATTING & FONTS
   ========================================== */

function formatText(command) {
  document.execCommand(command, false, null);
}

function insertQuote() {
  document.execCommand("formatBlock", false, "blockquote");
}

function changeActiveCharacterFont(fontValue) {
  const char = getCharacter(appState.activePOV);
  if (char) {
    char.font = fontValue;
    document.documentElement.style.setProperty("--active-font", fontValue);
    saveToStorage();
  }
}


/* ==========================================
   STORY SETUP & MODALS
   ========================================== */

function openSetupModal(mode = 'new') {
  const modal = document.getElementById("modal-setup");
  if (!modal) return;

  const titleInput = document.getElementById("setup-title");
  const countInput = document.getElementById("setup-perspective-count");

  if (titleInput) titleInput.value = appState.storyTitle;
  if (countInput) countInput.value = appState.characters.length;

  generatePerspectiveFields();
  modal.classList.add("open");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("open");
}

function generatePerspectiveFields() {
  const container = document.getElementById("setup-perspectives");
  const countInput = document.getElementById("setup-perspective-count");
  if (!container || !countInput) return;

  let count = parseInt(countInput.value) || 1;
  count = Math.min(Math.max(count, 1), MAX_PERSPECTIVES);

  container.innerHTML = "";

  const defaultColors = ["#d97706", "#7c3aed", "#2563eb", "#059669", "#dc2626", "#db2777"];

  for (let i = 0; i < count; i++) {
    const existing = appState.characters[i] || {};
    const charId = existing.id || `p${i + 1}`;
    const name = existing.name || `Character ${i + 1}`;
    const color = existing.color || defaultColors[i % defaultColors.length];
    const font = existing.font || "'EB Garamond', serif";

    const col = document.createElement("div");
    col.className = "config-col";
    col.style.setProperty("--character-color", color);

    col.innerHTML = `
      <h3>Character ${i + 1}</h3>

      <div class="form-group">
        <label>Name</label>
        <input type="text" id="setup-name-${i}" value="${escapeHTML(name)}" required />
      </div>

      <div class="form-group">
        <label>Accent Color</label>
        <input type="color" id="setup-color-${i}" value="${color}" />
      </div>

      <div class="form-group">
        <label>Default Font</label>
        <select id="setup-font-${i}" class="font-select">
          <option value="'EB Garamond', serif" ${font.includes('Garamond') ? 'selected' : ''}>Garamond</option>
          <option value="'Playfair Display', serif" ${font.includes('Playfair') ? 'selected' : ''}>Playfair</option>
          <option value="'Courier Prime', monospace" ${font.includes('Courier') ? 'selected' : ''}>Typewriter</option>
          <option value="'Caveat', cursive" ${font.includes('Caveat') ? 'selected' : ''}>Handwritten</option>
          <option value="'Inter', sans-serif" ${font.includes('Inter') ? 'selected' : ''}>Modern Sans</option>
        </select>
      </div>

      <div class="form-group">
        <label>Avatar (URL)</label>
        <input type="text" id="setup-img-${i}" value="${escapeHTML(existing.image || '')}" placeholder="https://..." />
      </div>
    `;

    container.appendChild(col);
  }
}

function saveSetup(event) {
  event.preventDefault();

  const titleInput = document.getElementById("setup-title");
  const countInput = document.getElementById("setup-perspective-count");

  appState.storyTitle = titleInput ? titleInput.value : appState.storyTitle;
  const count = parseInt(countInput.value) || appState.characters.length;

  const newCharacters = [];

  for (let i = 0; i < count; i++) {
    const existing = appState.characters[i] || {};
    const nameVal = document.getElementById(`setup-name-${i}`).value;
    const colorVal = document.getElementById(`setup-color-${i}`).value;
    const fontVal = document.getElementById(`setup-font-${i}`).value;
    const imgVal = document.getElementById(`setup-img-${i}`).value;

    newCharacters.push({
      id: existing.id || `p${i + 1}`,
      name: nameVal || `Character ${i + 1}`,
      image: imgVal || "",
      font: fontVal,
      color: colorVal,
      backstory: existing.backstory || "",
      traits: existing.traits || "",
      secrets: existing.secrets || "",
      motivations: existing.motivations || ""
    });
  }

  appState.characters = newCharacters;
  appState.isConfigured = true;

  if (!getCharacter(appState.activePOV)) {
    appState.activePOV = appState.characters[0].id;
  }

  closeModal("modal-setup");
  showMainApp();
}

function applySetup() {
  const titleHeader = document.getElementById("header-story-title");
  if (titleHeader) {
    titleHeader.textContent = appState.storyTitle;
  }
}


/* ==========================================
   EXPORT MANUSCRIPT
   ========================================== */

function exportManuscript() {
  saveCurrentPageContent();

  let textContent = `${appState.storyTitle.toUpperCase()}\n${"=".repeat(appState.storyTitle.length)}\n\n`;

  appState.chapters.forEach(chap => {
    textContent += `\n--- ${chap.title.toUpperCase()} ---\n\n`;
    chap.pages.forEach((pg, index) => {
      const char = getCharacter(pg.pov);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = pg.content;
      const cleanText = tempDiv.innerText || tempDiv.textContent || "";

      textContent += `[Page ${index + 1} - ${char.name} POV]\n${cleanText}\n\n`;
    });
  });

  const blob = new Blob([textContent], { type: "text/plain" });
  const anchor = document.createElement("a");
  anchor.download = `${appState.storyTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_manuscript.txt`;
  anchor.href = window.URL.createObjectURL(blob);
  anchor.click();
}