// utils/ObjectPool.js — Generic object pool to reduce GC pressure

export class ObjectPool {
  /**
   * @param {Function} factory  — creates a fresh object
   * @param {Function} reset    — resets an object before reuse; called with (obj, ...args)
   * @param {number}   initial  — pre-allocate this many objects
   */
  constructor(factory, reset, initial = 0) {
    this._factory = factory;
    this._reset = reset;
    this._pool = [];
    for (let i = 0; i < initial; i++) this._pool.push(factory());
  }

  /** Acquire an object, initialising it with the supplied args. */
  acquire(...args) {
    const obj = this._pool.length > 0 ? this._pool.pop() : this._factory();
    this._reset(obj, ...args);
    return obj;
  }

  /** Return an object to the pool. */
  release(obj) {
    this._pool.push(obj);
  }

  /** Release all objects in an array back to the pool and clear it. */
  releaseAll(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
      this._pool.push(arr[i]);
    }
    arr.length = 0;
  }

  get size() { return this._pool.length; }
}
