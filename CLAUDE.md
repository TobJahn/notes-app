# Notes App

## Project
A minimal notes app for personal use in one browser (like Apple Notes or Google Keep).

Core features:
- A "New note" button creates a note.
- Each note has a title and a body.
- Changes are saved automatically while typing (short debounce, no Save button).
- A list of all notes, newest first (by `updatedAt`). Clicking a note opens it to view or edit.
- A note can be deleted from the list.
- Notes persist across reloads.

Stretch feature (after the core works): a search/filter box that narrows the list as you type, matching title and body, case-insensitive.

Extra features:
- Keyboard shortcuts: `N` new note and `/` focus search (both only when not typing in a field, no modifier keys); `Esc` closes the open note (after saving) and clears the search when in the search box. Shortcuts are shown as hints in the UI.

## Stack
- Plain HTML, CSS and JavaScript in `index.html`, `style.css` and `app.js`.
- No frameworks, libraries, build step or backend.
- Data in `localStorage` under the key `notes-app:notes`, stored as a JSON array of notes: `{ id, title, body, updatedAt }`.
- Hosted on GitHub Pages from `main`, `/` (root).

## How to run
- Local: `python3 -m http.server` in the project folder, then open http://localhost:8000
- Live: https://tobjahn.github.io/notes-app/

## Code rules
- Relative paths only (needed for GitHub Pages).
- Lowercase file names. Keep the three files; no new files without asking.
- Readable code: clear names, small functions, short comments where the intent isn't obvious.
- Notes with an empty title and empty body are not saved.

## Data & security
- Never store passwords, API keys, tokens or personal data.
- No secrets in the code.

## Git workflow
- Always work on a branch, never directly on `main` (only exception: the initial commit).
- Commit at every working state with specific messages.
- Scan staged changes for keys, passwords or tokens before every commit and push.
- Only push or open pull requests when asked.

## Working style
- Before starting, explain what will change and which files.
- One feature at a time.
- Ask if something is unclear.

## Done when
- Works at 1280 px and 375 px wide, with readable contrast.
- Empty state shows: "No notes yet. Click New note to create your first one."
- Enter in the title field moves to the body; Enter in the body adds a new line.
- Notes survive a reload.
- Search/filter narrows the list as you type.
- Keyboard shortcuts work and never fire while typing in the title, body or search box.
- All features work on the live URL in a fresh incognito window.
