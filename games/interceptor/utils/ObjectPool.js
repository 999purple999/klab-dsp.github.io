export class ObjectPool {
  constructor(factory, reset, initialSize = 20) {
    this._factory = factory;
    this._reset = reset;
    this._pool = [];
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(factory());
    }
  }

  get() {
    if (this._pool.length > 0) {
      return this._pool.pop();
    }
    return this._factory();
  }

  release(obj) {
    this._reset(obj);
    this._pool.push(obj);
  }

  get available() {
    return this._pool.length;
  }
}
