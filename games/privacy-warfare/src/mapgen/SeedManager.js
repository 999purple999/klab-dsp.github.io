export class SeedManager {
  constructor(seed) { this.seed = seed >>> 0; }

  next() {
    // xorshift32
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >> 17;
    this.seed ^= this.seed << 5;
    return (this.seed >>> 0) / 0xFFFFFFFF;
  }

  nextInt(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
  nextFloat(min, max) { return this.next() * (max - min) + min; }

  static fromLevel(level, zone = 0) { return new SeedManager(level + zone * 100 + 0xDEAD); }
}
