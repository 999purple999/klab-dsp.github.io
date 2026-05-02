export class ObjectPool {
  constructor(factory, reset, size = 50) {
    this._factory = factory;
    this._reset = reset;
    this._pool = [];
    this._active = [];
    for (let i = 0; i < size; i++) {
      this._pool.push(factory());
    }
  }

  acquire() {
    let obj;
    if (this._pool.length > 0) {
      obj = this._pool.pop();
    } else {
      obj = this._factory();
    }
    this._active.push(obj);
    return obj;
  }

  release(obj) {
    const idx = this._active.indexOf(obj);
    if (idx !== -1) {
      this._active.splice(idx, 1);
      this._reset(obj);
      this._pool.push(obj);
    }
  }

  releaseAll() {
    for (const obj of this._active) {
      this._reset(obj);
      this._pool.push(obj);
    }
    this._active = [];
  }

  get active() {
    return this._active;
  }
}
