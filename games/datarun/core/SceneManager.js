export class SceneManager {
  constructor() {
    this._stack = [];
  }

  push(scene) {
    // Don't exit the current scene — it remains as background (e.g. for pause overlay)
    // Just pause it if it has a pause method
    const current = this.current();
    if (current && current.pause) current.pause();
    this._stack.push(scene);
    if (scene.enter) scene.enter();
  }

  pop() {
    const top = this._stack.pop();
    if (top && top.exit) top.exit();
    const next = this.current();
    if (next && next.resume) next.resume();
  }

  replace(scene) {
    const top = this._stack.pop();
    if (top && top.exit) top.exit();
    this._stack.push(scene);
    if (scene.enter) scene.enter();
  }

  current() {
    return this._stack[this._stack.length - 1] || null;
  }

  update(dt) {
    const scene = this.current();
    if (scene && scene.update) scene.update(dt);
  }

  render(ctx) {
    // Render all scenes (lower scenes show through if overlay)
    for (const scene of this._stack) {
      if (scene.render) scene.render(ctx);
    }
  }

  clear() {
    while (this._stack.length > 0) {
      const s = this._stack.pop();
      if (s && s.exit) s.exit();
    }
  }
}
