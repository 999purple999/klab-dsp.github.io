// ─── ObjectPool ───────────────────────────────────────────────────────────────
// Generic object pool to avoid GC pressure from frequent allocations.

export class ObjectPool {
  /**
   * @param {function}  factory     - () => object  Creates a new pooled object.
   * @param {function}  reset       - (obj, ...args) Resets an object before reuse.
   * @param {number}    initialSize - Pre-allocated object count.
   */
  constructor(factory, reset, initialSize = 50) {
    this.factory = factory;
    this.reset   = reset;
    this.pool    = [];
    this.active  = [];

    for (let i = 0; i < initialSize; i++) this.pool.push(this.factory());
  }

  // ── Acquire ──────────────────────────────────────────────────────────────────

  /**
   * Take an object from the free list (or create one if empty),
   * reset it with the supplied arguments, and mark it active.
   */
  get(...args) {
    const obj = this.pool.length > 0 ? this.pool.pop() : this.factory();
    this.reset(obj, ...args);
    this.active.push(obj);
    return obj;
  }

  // ── Release ──────────────────────────────────────────────────────────────────

  /** Return a single object to the free list. */
  release(obj) {
    const i = this.active.indexOf(obj);
    if (i >= 0) {
      this.active.splice(i, 1);
      this.pool.push(obj);
    }
  }

  /** Return all active objects to the free list at once. */
  releaseAll() {
    while (this.active.length) this.pool.push(this.active.pop());
  }

  // ── Inspection ───────────────────────────────────────────────────────────────

  /** Number of currently active (in-use) objects. */
  get size() {
    return this.active.length;
  }

  /** Number of objects waiting in the free list. */
  get freeCount() {
    return this.pool.length;
  }
}

// ── Pre-built pool factories ──────────────────────────────────────────────────

/**
 * Pool of projectile objects.
 * Shape: { x, y, vx, vy, r, col, life, active }
 */
export function createProjectilePool(initialSize = 100) {
  return new ObjectPool(
    () => ({ x: 0, y: 0, vx: 0, vy: 0, r: 5, col: '#fff', life: 3, active: false }),
    (obj, x, y, vx, vy, r, col, life) => {
      Object.assign(obj, { x, y, vx, vy, r, col, life, active: true });
    },
    initialSize
  );
}

/**
 * Pool of particle objects.
 * Shape: { x, y, vx, vy, r, col, life, active }
 */
export function createParticlePool(initialSize = 200) {
  return new ObjectPool(
    () => ({ x: 0, y: 0, vx: 0, vy: 0, r: 2, col: '#fff', life: 0.5, active: false }),
    (obj, x, y, vx, vy, r, col, life) => {
      Object.assign(obj, { x, y, vx, vy, r, col, life, active: true });
    },
    initialSize
  );
}
