// core/SceneManager.js — Scene stack manager

export class SceneManager {
  constructor() {
    this._scenes = {};
    this._active = null;
    this._stack = []; // modal scenes on top
  }

  register(name, scene) {
    this._scenes[name] = scene;
    scene.name = name;
  }

  go(name, data) {
    if (this._active && this._active.onExit) this._active.onExit();
    this._stack = [];
    this._active = this._scenes[name];
    if (this._active && this._active.onEnter) this._active.onEnter(data);
  }

  push(name, data) {
    if (this._active) this._stack.push(this._active);
    this._active = this._scenes[name];
    if (this._active && this._active.onEnter) this._active.onEnter(data);
  }

  pop() {
    if (this._active && this._active.onExit) this._active.onExit();
    this._active = this._stack.pop() || null;
    if (this._active && this._active.onResume) this._active.onResume();
  }

  update(dt) {
    if (this._active && this._active.update) this._active.update(dt);
  }

  render(dt) {
    if (this._active && this._active.render) this._active.render(dt);
  }

  get current() { return this._active; }
}
