# Copilot instructions for `my-first-app`

## Project overview

This is a dependency-free browser game called **Star Runner**. It is a static HTML/CSS/JavaScript application; there is no build system, package manager, test runner, or linter configuration in the repository.

### Local development and validation

- Open `index.html` directly in a browser for a quick preview.
- For a local HTTP server (useful when browser security rules matter), run:
  ```sh
  python3 -m http.server 8000
  ```
  Then open `http://localhost:8000/`.
- There is currently no project-defined build, test, or lint command, and no single-test command. Validate gameplay changes manually in a browser and use a JavaScript syntax check such as `node --check script.js` when Node.js is available.

## Architecture

- `index.html` owns the page shell and the small DOM surface around the game: HUD values, status text, game-over overlay, and restart button. It loads `style.css` and `script.js`.
- `style.css` owns the responsive page presentation and the retro visual treatment. The canvas is visually resized with CSS but keeps its logical drawing resolution at `960x540`.
- `script.js` contains the complete game runtime:
  - `resetGame()` creates the mutable game state and populates the level from `levelPlatforms`, coin coordinates, and enemy coordinates.
  - `update(delta)` handles keyboard input, physics, platform landing, camera tracking, collectibles, enemy collisions, lives, and the finish condition.
  - `draw()` renders the sky, background, level objects, player, enemies, coins, and goal to the canvas in world coordinates translated by `cameraX`.
  - `loop()` runs update/render through `requestAnimationFrame`.
  - DOM updates are intentionally limited to `updateHud()` and the overlay helpers.

The game uses a fixed logical world (`WORLD_WIDTH = 3600`) with a camera that follows the player. Platforms, coins, and enemies use simple coordinate arrays converted to objects at reset time. The right-side flag is the win trigger; the current win condition is reaching it, while score/lives are displayed as game feedback.

## Repository-specific conventions

- Keep the application dependency-free and preserve the three-file separation: markup in `index.html`, presentation in `style.css`, and behavior/state/rendering in `script.js`.
- Use the existing plain JavaScript style and browser APIs rather than introducing a framework or module bundler. The script is loaded at the end of `body`, so it queries DOM elements during startup without a separate initialization framework.
- Keep level geometry and placements in world coordinates. Add or move platforms, coins, and enemies through their existing coordinate data rather than hard-coding new drawing-only shapes.
- Preserve the update/render split: gameplay mutation belongs in `update()`, and canvas drawing belongs in `draw()`/`drawBackground()`. Use `requestAnimationFrame` timing and the existing capped `delta` behavior for frame-rate resilience.
- Treat `state` (`"playing"`, `"over"`, or `"won"`) as the gate for gameplay updates. Terminal states should use `showOverlay()` and become playable again through `resetGame()`.
- Keep player/enemy collision rectangles and platform landing logic aligned with the current object dimensions. Changes to dimensions or physics should be checked against gaps, elevated platforms, enemy stomping, falling, and the flag.
- Update the HUD through `updateHud()` instead of writing `score`, `lives`, or `message` elements directly from gameplay branches.
- Preserve keyboard controls and `preventDefault()` behavior for arrow keys, Space, and the supported WASD controls unless the visible instructions and event handling are changed together.
- 説明やユーザー向けの案内文は日本語で表示すること。Keep user-facing copy in Japanese where it already exists. The page language is `ja`; the game title and terminal overlay labels intentionally remain in English for the current visual style.
- The stylesheet imports the two Google Fonts used by the UI. Avoid adding font or asset dependencies unless the static loading behavior and offline implications are considered.
