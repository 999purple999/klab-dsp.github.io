// Nodi base del Behavior Tree
export class BTNode {
  constructor() { this.status = 'ready'; }
  tick(ctx) { return 'failure'; }  // 'success' | 'failure' | 'running'
}

export class Selector extends BTNode {
  constructor(...children) { super(); this.children = children; }
  tick(ctx) {
    for (const c of this.children) {
      const r = c.tick(ctx);
      if (r !== 'failure') return r;
    }
    return 'failure';
  }
}

export class Sequence extends BTNode {
  constructor(...children) { super(); this.children = children; }
  tick(ctx) {
    for (const c of this.children) {
      const r = c.tick(ctx);
      if (r !== 'success') return r;
    }
    return 'success';
  }
}

export class Condition extends BTNode {
  constructor(fn) { super(); this.fn = fn; }
  tick(ctx) { return this.fn(ctx) ? 'success' : 'failure'; }
}

export class Action extends BTNode {
  constructor(fn) { super(); this.fn = fn; }
  tick(ctx) { return this.fn(ctx) || 'success'; }
}

// Albero predefinito per un nemico shooter
export function makeShooterTree(enemy, eprojs) {
  return new Selector(
    // Se frozen: failure (non fa niente)
    new Condition(ctx => ctx.enemy.frozen <= 0),
    // Se vicino: attacca in corpo a corpo
    new Sequence(
      new Condition(ctx => ctx.dist < 60),
      new Action(() => { /* corpo a corpo handled altrove */ })
    ),
    // Se in range: spara
    new Sequence(
      new Condition(ctx => ctx.dist < 280 && ctx.hasLOS),
      new Action(ctx => {
        ctx.enemy.shootTimer -= ctx.dt;
        if (ctx.enemy.shootTimer <= 0) {
          ctx.enemy.shootTimer = 1.8 + Math.random() * 1.5;
          const dx = ctx.px - ctx.enemy.x, dy = ctx.py - ctx.enemy.y;
          const d = Math.hypot(dx, dy) || 1;
          eprojs.push({ x: ctx.enemy.x, y: ctx.enemy.y, vx: dx / d * 185, vy: dy / d * 185, r: 5, col: ctx.enemy.col, life: 3 });
        }
        return 'running';
      })
    ),
    // Default: avvicinati
    new Action(() => 'running')
  );
}
