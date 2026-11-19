"use strict";

// ---------- Settings ----------
const STORAGE_KEY = "notes-app:notes";
const SAVE_DELAY_MS = 300; // auto-save this long after the last keystroke

// ---------- Page elements ----------
const els = {
  newNote: document.getElementById("new-note"),
  list: document.getElementById("note-list"),
  emptyState: document.getElementById("empty-state"),
  searchBar: document.getElementById("search-bar"),
  search: document.getElementById("search"),
  noResults: document.getElementById("no-results"),
  placeholder: document.getElementById("editor-placeholder"),
  editor: document.getElementById("editor"),
  back: document.getElementById("back"),
  title: document.getElementById("note-title"),
  body: document.getElementById("note-body"),
  status: document.getElementById("save-status"),
};

// ---------- State ----------
let notes = loadNotes(); // saved notes: [{ id, title, body, updatedAt }]
let currentNote = null; // note open in the editor (not stored until it has content)
let saveTimer = null; // pending auto-save, if any

// ---------- Storage ----------
function loadNotes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isValidNote) : [];
  } catch {
    return [];
  }
}

function isValidNote(note) {
  return (
    note !== null &&
    typeof note === "object" &&
    typeof note.id === "string" &&
    typeof note.title === "string" &&
    typeof note.body === "string" &&
    typeof note.updatedAt === "number"
  );
}

function persistNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
}

// ---------- Helpers ----------
function createId() {
  if (window.crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function isEmptyNote(note) {
  return note.title.trim() === "" && note.body.trim() === "";
}

function isStored(id) {
  return notes.some((note) => note.id === id);
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// True if the note's title or body contains the search text (case-insensitive).
function matchesSearch(note, query) {
  if (query === "") return true;
  return (note.title + "\n" + note.body).toLowerCase().includes(query);
}

function getSearchQuery() {
  return els.search.value.trim().toLowerCase();
}

function clearSearch() {
  els.search.value = "";
  renderList();
}

function setStatus(text) {
  els.status.textContent = text;
}

// ---------- Saving ----------
function scheduleSave() {
  clearTimeout(saveTimer);
  setStatus("Saving…");
  saveTimer = setTimeout(saveCurrentNote, SAVE_DELAY_MS);
}

// Save right away if an auto-save is still waiting (e.g. before switching notes).
function flushSave() {
  if (saveTimer !== null) {
    saveCurrentNote();
  }
}

function saveCurrentNote() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!currentNote) return;

  currentNote.title = els.title.value;
  currentNote.body = els.body.value;
  const index = notes.findIndex((note) => note.id === currentNote.id);

  if (isEmptyNote(currentNote)) {
    // Empty notes are never stored; remove it if it was stored before.
    if (index !== -1) {
      notes.splice(index, 1);
      persistNotes();
    }
    setStatus("Empty notes aren't saved");
  } else {
    currentNote.updatedAt = Date.now();
    const copy = { ...currentNote };
    if (index === -1) {
      notes.push(copy);
    } else {
      notes[index] = copy;
    }
    setStatus(persistNotes() ? "Saved" : "Couldn't save — browser storage is full or blocked");
  }

  renderList();
}

// ---------- Actions ----------
function openNote(id) {
  flushSave();
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  currentNote = { ...note };
  showEditor();
  setStatus("");
  renderList();
}

function createNote() {
  flushSave();
  els.search.value = ""; // so the new note isn't hidden by an old search

  // Reuse the open note if it is still a blank, unsaved draft.
  if (!currentNote || !isEmptyNote(currentNote) || isStored(currentNote.id)) {
    currentNote = { id: createId(), title: "", body: "", updatedAt: Date.now() };
  }

  showEditor();
  setStatus("");
  renderList();
  els.title.focus();
}

function deleteNote(id) {
  flushSave();
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  const name = note.title.trim() || "Untitled";
  if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;

  notes = notes.filter((n) => n.id !== id);
  persistNotes();
  if (currentNote && currentNote.id === id) {
    closeEditor();
  }
  renderList();
}

function closeEditor() {
  flushSave();
  currentNote = null;
  els.editor.hidden = true;
  els.placeholder.hidden = false;
  document.body.classList.remove("is-editing");
  renderList();
}

// ---------- Rendering ----------
function showEditor() {
  els.title.value = currentNote.title;
  els.body.value = currentNote.body;
  els.editor.hidden = false;
  els.placeholder.hidden = true;
  document.body.classList.add("is-editing");
}

function renderList() {
  const hasNotes = notes.length > 0;
  const query = getSearchQuery();
  const visible = notes
    .filter((note) => matchesSearch(note, query))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  els.emptyState.hidden = hasNotes;
  els.searchBar.hidden = !hasNotes;

  const showNoResults = hasNotes && visible.length === 0;
  els.noResults.hidden = !showNoResults;
  els.noResults.textContent = showNoResults ? `No notes match "${els.search.value.trim()}".` : "";

  els.list.replaceChildren(...visible.map(renderNoteItem));
}

function renderNoteItem(note) {
  const isActive = currentNote !== null && currentNote.id === note.id;
  const title = note.title.trim() || "Untitled";

  const item = document.createElement("li");
  item.className = "note-item" + (isActive ? " is-active" : "");

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "note-open";
  if (isActive) openButton.setAttribute("aria-current", "true");
  openButton.addEventListener("click", () => openNote(note.id));

  const titleEl = document.createElement("span");
  titleEl.className = "note-item-title";
  titleEl.textContent = title;

  const previewEl = document.createElement("span");
  previewEl.className = "note-item-preview";
  previewEl.textContent = note.body.trim().split("\n")[0] || "No text";

  const dateEl = document.createElement("span");
  dateEl.className = "note-item-date";
  dateEl.textContent = formatDate(note.updatedAt);

  openButton.append(titleEl, previewEl, dateEl);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn note-delete";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete note "${title}"`);
  deleteButton.addEventListener("click", () => deleteNote(note.id));

  item.append(openButton, deleteButton);
  return item;
}

// ---------- Events ----------
els.newNote.addEventListener("click", createNote);
els.back.addEventListener("click", closeEditor);
els.title.addEventListener("input", scheduleSave);
els.body.addEventListener("input", scheduleSave);

// Search: narrow the list as you type; Escape clears it.
els.search.addEventListener("input", renderList);
els.search.addEventListener("keydown", (event) => {
  if (event.key === "Escape") clearSearch();
});

// Enter in the title jumps to the body (Enter in the body adds a new line as usual).
els.title.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    els.body.focus();
  }
});

// Don't lose the last keystrokes when the tab is hidden or closed.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushSave();
});
window.addEventListener("pagehide", flushSave);

// ---------- Start ----------
renderList();
