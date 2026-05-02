# Privacy Warfare

A roguelite action-RPG browser game. Defend your data against waves of cyber-threats
using 10 unique weapons, 6 abilities, and persistent progression — all in vanilla ES modules,
no build step required on GitHub Pages.

## How to Play

Move your agent and blast incoming threats. Survive as many waves as possible.

### Controls

| Input | Action |
|-------|--------|
| WASD / Arrow keys | Move camera / player |
| Mouse | Aim |
| Left click / Space | Fire active weapon |
| 1–0 | Select weapon slot 1–10 |
| Q / E | Cycle weapons |
| F | Ability: Bomb |
| G | Ability: Shield Pulse |
| X | Ability: Time Warp |
| V | Ability: Dash |
| C | Ability: Nuke |
| Z | Ability: Grappling Hook |

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Architecture

```
src/
  core/        Engine, Game, SceneManager, Input
  scenes/      GameScene, MenuScene, GameOverScene
  entities/    Player, Enemy, Boss, Pickup
    Weapon/    WeaponBase + 10 weapon classes
    Enemy/     BaseEnemy, AIController, BehaviorTree + 10 enemy types
    Boss/      Boss variants
  audio/       AudioManager, AdaptiveMusic, SFXLibrary
  ui/          HUD, MiniMap, Modal, Button, FloatingText, WeaponWheel, VirtualJoystick, CampaignMapUI
  mapgen/      DungeonGenerator, MapData, RoomTemplates, TrapPlacer, SeedManager
  rendering/   Camera, Renderer, ParticleEmitter, Effects, Lighting
  data/        CampaignSave, Storage, Progression, MasterySystem, DailyChallenges, Leaderboard, Shop
  steam/       Steamworks, ElectronBridge (platform stubs)
  utils/       EventBus, math, ObjectPool, Device
```

## GitHub Pages

The game runs directly from `src/index.html` — no build step needed.
Push to `main` and GitHub Pages serves it from `/games/privacy-warfare/src/`.

To build a minified bundle: `npm run build` (outputs to `dist/`).
