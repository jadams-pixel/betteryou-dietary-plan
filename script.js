/* ==========================================
   PERSPECTIVE WRITER
   Multi-perspective story writing app
   ========================================== */

const STORAGE_KEY = "dual_pov_notepad_state";
const MAX_PERSPECTIVES = 20;
let isAnimatingPageTurn = false;

const PALETTE = [
  "#d97706", "#7c3aed", "#2563eb", "#059669",
  "#dc2626", "#db2777", "#4f46e5", "#0891b2"
];

const FONTS = [
  "'EB Garamond', serif",
  "'Playfair Display', serif",
  "'Courier Prime', monospace",
  "'Caveat', cursive",
  "'Inter', sans-serif"
];

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

function setupEditorListeners() {
  const editor = getEditor();
  if (!editor) return;

  editor.addEventListener("input", () => {
    saveCurrentPageContent();
    updateStats();
  });
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

function getAllPagesFlat() {
  const pagesList = [];
  appState.chapters.forEach(chap => {
    chap.pages.forEach(pg => {
      pagesList.push({ page: pg, chapter: chap });
    });
  });
  return pagesList;
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
   STORY SETUP MODAL & CONFIGURATION
   ========================================== */

function openSetupModal(mode = "new") {
  const modal = document.getElementById("modal-setup");
  const titleInput = document.getElementById("setup-title");
  const countInput = document.getElementById("setup-perspective-count");
  const modalHeader = document.getElementById("setup-modal-title");

  if (modalHeader) {
    modalHeader.textContent = mode === "edit" ? "Story Settings" : "Story Setup";
  }

  titleInput.value = appState.storyTitle;
  countInput.value = appState.characters.length;

  generatePerspectiveFields();
  modal.classList.add("open");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("open");
}

function generatePerspectiveFields() {
  const container = document.getElementById("setup-perspectives");
  const count = Math.min(Math.max(parseInt(document.getElementById("setup-perspective-count").value) || 1, 1), MAX_PERSPECTIVES);

  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const existing = appState.characters[i] || {};
    const charId = existing.id || `p${i + 1}`;
    const name = existing.name || `Character ${i + 1}`;
    const color = existing.color || PALETTE[i % PALETTE.length];
    const font = existing.font || FONTS[i % FONTS.length];

    const col = document.createElement("div");
    col.className = "config-col";
    col.style.setProperty("--character-color", color);

    col.innerHTML = `
      <h3>${name}</h3>
      <div class="form-group">
        <label>Character Name</label>
        <input type="text" class="char-name-input" data-id="${charId}" value="${escapeHTML(name)}" required />
      </div>
      <div class="form-group">
        <label>Theme Color</label>
        <input type="color" class="char-color-input" data-id="${charId}" value="${color}" />
      </div>
      <div class="form-group">
        <label>Writing Font</label>
        <select class="font-select char-font-input" data-id="${charId}">
          <option value="'EB Garamond', serif" ${font.includes("Garamond") ? "selected" : ""}>Garamond</option>
          <option value="'Playfair Display', serif" ${font.includes("Playfair") ? "selected" : ""}>Playfair</option>
          <option value="'Courier Prime', monospace" ${font.includes("Courier") ? "selected" : ""}>Typewriter</option>
          <option value="'Caveat', cursive" ${font.includes("Caveat") ? "selected" : ""}>Handwritten</option>
          <option value="'Inter', sans-serif" ${font.includes("Inter") ? "selected" : ""}>Modern Sans</option>
        </select>
      </div>
    `;

    container.appendChild(col);
  }
}

function saveSetup(e) {
  e.preventDefault();

  const title = document.getElementById("setup-title").value.trim() || "Untitled Story";
  const nameInputs = document.querySelectorAll(".char-name-input");
  const colorInputs = document.querySelectorAll(".char-color-input");
  const fontInputs = document.querySelectorAll(".char-font-input");

  const newCharacters = [];

  nameInputs.forEach((input, index) => {
    const id = input.dataset.id;
    const existing = getCharacter(id);

    newCharacters.push({
      id: id,
      name: input.value.trim() || `Character ${index + 1}`,
      color: colorInputs[index].value,
      font: fontInputs[index].value,
      image: existing.image || "",
      backstory: existing.backstory || "",
      traits: existing.traits || "",
      secrets: existing.secrets || "",
      motivations: existing.motivations || ""
    });
  });

  appState.storyTitle = title;
  appState.characters = newCharacters;
  appState.isConfigured = true;

  if (!newCharacters.some(c => c.id === appState.activePOV)) {
    appState.activePOV = newCharacters[0].id;
  }

  closeModal("modal-setup");
  showMainApp();
}

function applySetup() {
  document.getElementById("header-story-title").textContent = appState.storyTitle;
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
   CHARACTER CARDS & PROFILES
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

function setActivePOV(charId) {
  appState.activePOV = charId;
  const currPage = getCurrentPage();
  if (currPage) {
    currPage.pov = charId;
  }
  renderPOVSwitcher();
  renderCharacterCards();
  renderPageTree();
  loadCurrentPage();
  saveToStorage();
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
    </div>

    <div class="profile-grid-boxes">
      <div class="bio-box-card box-rose">
        <label>Backstory</label>
        <textarea class="bio-textarea" onchange="updateCharBio('${char.id}', 'backstory', this.value)">${escapeHTML(char.backstory)}</textarea>
      </div>

      <div class="bio-box-card box-amber">
        <label>Traits</label>
        <textarea class="bio-textarea" onchange="updateCharBio('${char.id}', 'traits', this.value)">${escapeHTML(char.traits)}</textarea>
      </div>

      <div class="bio-box-card box-indigo">
        <label>Secrets</label>
        <textarea class="bio-textarea" onchange="updateCharBio('${char.id}', 'secrets', this.value)">${escapeHTML(char.secrets)}</textarea>
      </div>

      <div class="bio-box-card box-emerald">
        <label>Motivations</label>
        <textarea class="bio-textarea" onchange="updateCharBio('${char.id}', 'motivations', this.value)">${escapeHTML(char.motivations)}</textarea>
      </div>
    </div>

    <div class="modal-actions" style="margin-top:1.2rem;">
      <button class="btn btn-outline" onclick="closeModal('modal-profile')">Close</button>
    </div>
  `;

  document.getElementById("modal-profile").classList.add("open");
}

function updateCharBio(charId, field, value) {
  const char = getCharacter(charId);
  if (char) {
    char[field] = value;
    saveToStorage();
  }
}


/* ==========================================
   3D PAGE FLIP ANIMATION & EDITOR LOGIC
   ========================================== */

function loadCurrentPage() {
  const page = getCurrentPage();
  const editor = getEditor();
  if (!page || !editor) return;

  const char = getCharacter(page.pov);

  document.body.setAttribute("data-pov", char.id);
  document.documentElement.style.setProperty("--active-accent", char.color);
  document.documentElement.style.setProperty("--active-font", char.font);

  document.getElementById("portrait-frame").innerHTML = char.image
    ? `<img src="${escapeHTML(char.image)}" alt="">`
    : `<div class="avatar-placeholder" style="background:${char.color}">${escapeHTML(char.name.substring(0, 2).toUpperCase())}</div>`;

  document.getElementById("portrait-name").textContent = char.name;
  document.getElementById("current-page-pov").textContent = `${char.name} POV`;
  document.getElementById("current-page-pov").style.background = char.color;

  const fontPicker = document.getElementById("active-font-picker");
  if (fontPicker) {
    fontPicker.value = char.font;
  }

  editor.innerHTML = page.content || "<p></p>";
  updateStats();
}

function saveCurrentPageContent() {
  const page = getCurrentPage();
  const editor = getEditor();
  if (page && editor) {
    page.content = editor.innerHTML;
  }
}

function animatePageFlip(targetPageId, callback) {
  if (isAnimatingPageTurn) return;
  isAnimatingPageTurn = true;

  saveCurrentPageContent();

  const pageCard = document.getElementById("page-card");
  const backTitle = document.getElementById("back-page-title");
  const backSubtitle = document.getElementById("back-page-subtitle");

  const targetPageObj = getAllPagesFlat().find(item => item.page.id === targetPageId);
  if (targetPageObj) {
    const targetChar = getCharacter(targetPageObj.page.pov);
    backTitle.textContent = targetPageObj.chapter.title;
    backSubtitle.textContent = `POV: ${targetChar.name}`;
  }

  pageCard.classList.add("flipped");

  setTimeout(() => {
    appState.activePageId = targetPageId;
    if (callback) callback();
    loadCurrentPage();
    renderSidebar();

    setTimeout(() => {
      pageCard.classList.remove("flipped");
      isAnimatingPageTurn = false;
      saveToStorage();
    }, 150);
  }, 400);
}

function switchPage(pageId) {
  if (pageId === appState.activePageId) return;
  animatePageFlip(pageId);
}

function nextPage() {
  const pagesFlat = getAllPagesFlat();
  const currentIndex = pagesFlat.findIndex(p => p.page.id === appState.activePageId);

  if (currentIndex < pagesFlat.length - 1) {
    animatePageFlip(pagesFlat[currentIndex + 1].page.id);
  } else {
    // Add new page to current chapter
    const currentChap = getCurrentChapter();
    const newPageId = createId();

    currentChap.pages.push({
      id: newPageId,
      pov: appState.activePOV,
      content: "<p></p>"
    });

    animatePageFlip(newPageId);
  }
}

function previousPage() {
  const pagesFlat = getAllPagesFlat();
  const currentIndex = pagesFlat.findIndex(p => p.page.id === appState.activePageId);

  if (currentIndex > 0) {
    animatePageFlip(pagesFlat[currentIndex - 1].page.id);
  }
}


/* ==========================================
   FORMATTING & UTILITIES
   ========================================== */

function formatText(command) {
  document.execCommand(command, false, null);
  getEditor().focus();
  saveCurrentPageContent();
}

function insertQuote() {
  document.execCommand("formatBlock", false, "blockquote");
  getEditor().focus();
  saveCurrentPageContent();
}

function changeActiveCharacterFont(fontValue) {
  const char = getCharacter(appState.activePOV);
  if (char) {
    char.font = fontValue;
    document.documentElement.style.setProperty("--active-font", fontValue);
    saveToStorage();
  }
}

function updateStats() {
  const editor = getEditor();
  if (!editor) return;

  const text = editor.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const readTime = Math.ceil(words / 200);

  document.getElementById("stat-words").textContent = `${words} word${words === 1 ? "" : "s"}`;
  document.getElementById("stat-read").textContent = `${readTime} min read`;
}

function exportManuscript() {
  saveCurrentPageContent();

  let manuscriptText = `${appState.storyTitle.toUpperCase()}\n`;
  manuscriptText += `==========================================\n\n`;

  appState.chapters.forEach(chap => {
    manuscriptText += `\n--- ${chap.title.toUpperCase()} ---\n\n`;

    chap.pages.forEach((pg, index) => {
      const char = getCharacter(pg.pov);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = pg.content;
      const plainText = tempDiv.innerText.trim();

      manuscriptText += `[Page ${index + 1} - POV: ${char.name}]\n`;
      manuscriptText += `${plainText}\n\n`;
    });
  });

  const blob = new Blob([manuscriptText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${appState.storyTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_manuscript.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
