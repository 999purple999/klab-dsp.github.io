import { SeedManager } from './SeedManager.js';

export class BSPNode {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.left = null; this.right = null;
    this.room = null;  // { x, y, w, h }
  }
}

export class DungeonGenerator {
  constructor(width, height, seed) {
    this.width = width;    // in tiles
    this.height = height;  // in tiles
    this.tileSize = 64;    // pixel per tile
    this.rng = new SeedManager(seed);
    this.rooms = [];
    this.corridors = [];   // array di {x1,y1,x2,y2} (linee di corridoio)
    this.root = null;
  }

  generate() {
    // 1. Crea root BSP node che copre tutta la mappa
    this.root = new BSPNode(0, 0, this.width, this.height);
    // 2. Suddividi ricorsivamente (min 6x6 tiles per stanza)
    this._split(this.root, 0);
    // 3. Crea stanze nelle foglie
    this._createRooms(this.root);
    // 4. Connetti stanze con corridoi
    this._connectRooms(this.root);
    return { rooms: this.rooms, corridors: this.corridors, root: this.root };
  }

  _split(node, depth) {
    if (depth > 5) return;
    const minSize = 8;
    // Scegli direzione split
    const splitH = this.rng.next() > 0.5;
    if (splitH) {
      if (node.h < minSize * 2) return;
      const split = this.rng.nextInt(minSize, node.h - minSize);
      node.left  = new BSPNode(node.x, node.y, node.w, split);
      node.right = new BSPNode(node.x, node.y + split, node.w, node.h - split);
    } else {
      if (node.w < minSize * 2) return;
      const split = this.rng.nextInt(minSize, node.w - minSize);
      node.left  = new BSPNode(node.x, node.y, split, node.h);
      node.right = new BSPNode(node.x + split, node.y, node.w - split, node.h);
    }
    this._split(node.left, depth + 1);
    this._split(node.right, depth + 1);
  }

  _createRooms(node) {
    if (!node.left && !node.right) {
      // Foglia: crea stanza con margine 1-2 tiles
      const margin = 2;
      const rx = node.x + this.rng.nextInt(margin, Math.max(margin, Math.floor(node.w * 0.2)));
      const ry = node.y + this.rng.nextInt(margin, Math.max(margin, Math.floor(node.h * 0.2)));
      const rw = node.w - (rx - node.x) - this.rng.nextInt(margin, Math.max(margin, Math.floor(node.w * 0.2)));
      const rh = node.h - (ry - node.y) - this.rng.nextInt(margin, Math.max(margin, Math.floor(node.h * 0.2)));
      if (rw >= 4 && rh >= 4) {
        node.room = { x: rx, y: ry, w: Math.max(4, rw), h: Math.max(4, rh) };
        this.rooms.push(node.room);
      }
      return;
    }
    if (node.left)  this._createRooms(node.left);
    if (node.right) this._createRooms(node.right);
  }

  _connectRooms(node) {
    if (!node.left || !node.right) return;
    this._connectRooms(node.left);
    this._connectRooms(node.right);
    // Connetti stanze più vicine dei due sub-alberi
    const rA = this._getClosestRoom(node.left);
    const rB = this._getClosestRoom(node.right);
    if (rA && rB) {
      const cx1 = Math.floor(rA.x + rA.w / 2);
      const cy1 = Math.floor(rA.y + rA.h / 2);
      const cx2 = Math.floor(rB.x + rB.w / 2);
      const cy2 = Math.floor(rB.y + rB.h / 2);
      // Corridoio a L: orizzontale poi verticale
      this.corridors.push({ x1: cx1, y1: cy1, x2: cx2, y2: cy1, w: 3 });
      this.corridors.push({ x1: cx2, y1: cy1, x2: cx2, y2: cy2, w: 3 });
    }
  }

  _getClosestRoom(node) {
    if (node.room) return node.room;
    const rL = node.left  ? this._getClosestRoom(node.left)  : null;
    const rR = node.right ? this._getClosestRoom(node.right) : null;
    return rL || rR;
  }

  // Converti in tiles array: 0=vuoto, 1=muro, 2=pavimento, 3=corridoio
  toTileMap() {
    const tiles = Array.from({ length: this.height }, () => new Uint8Array(this.width).fill(1));
    this.rooms.forEach(r => {
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++)
          if (y >= 0 && y < this.height && x >= 0 && x < this.width) tiles[y][x] = 2;
    });
    this.corridors.forEach(c => {
      const minX = Math.min(c.x1, c.x2), maxX = Math.max(c.x1, c.x2);
      const minY = Math.min(c.y1, c.y2), maxY = Math.max(c.y1, c.y2);
      const hw = Math.floor((c.w || 2) / 2);
      for (let y = minY - hw; y <= maxY + hw; y++)
        for (let x = minX - hw; x <= maxX + hw; x++)
          if (y >= 0 && y < this.height && x >= 0 && x < this.width) tiles[y][x] = 3;
    });
    return tiles;
  }

  // Ritorna posizione spawn del player (centro della prima stanza)
  getPlayerSpawn() {
    if (!this.rooms.length) return { x: this.width / 2, y: this.height / 2 };
    const r = this.rooms[0];
    return { x: (r.x + r.w / 2) * this.tileSize, y: (r.y + r.h / 2) * this.tileSize };
  }

  // Ritorna posizioni nemici (una per ogni altra stanza)
  getEnemySpawns() {
    return this.rooms.slice(1).map(r => ({
      x: (r.x + r.w / 2) * this.tileSize,
      y: (r.y + r.h / 2) * this.tileSize,
    }));
  }
}
