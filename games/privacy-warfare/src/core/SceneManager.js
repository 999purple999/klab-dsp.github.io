// ─── SceneManager ─────────────────────────────────────────────────────────────
// Simple scene stack.  Each scene has optional enter() / exit() / update(dt) / render().

export class SceneManager {
  constructor() {
    this._stack = [];
  }

  push(scene) {
    this._stack.push(scene);
    if (scene.enter) scene.enter();
  }

  pop() {
    const scene = this._stack.pop();
    if (scene && scene.exit) scene.exit();
    return scene;
  }

  replace(scene) {
    if (this._stack.length) this.pop();
    this.push(scene);
  }

  current() {
    return this._stack[this._stack.length - 1] || null;
  }

  update(dt) {
    const s = this.current();
    if (s && s.update) s.update(dt);
  }

  render() {
    const s = this.current();
    if (s && s.render) s.render();
  }
}
