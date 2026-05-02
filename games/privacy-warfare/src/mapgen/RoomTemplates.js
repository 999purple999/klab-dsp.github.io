export const ROOM_TEMPLATES = [
  { name: 'Empty', obstacles: [] },
  { name: 'Central Pillar', obstacles: [{ dx: 0.5, dy: 0.5, w: 0.1, h: 0.1 }] },
  { name: 'Four Columns', obstacles: [
    { dx: 0.25, dy: 0.25, w: 0.08, h: 0.08 },
    { dx: 0.75, dy: 0.25, w: 0.08, h: 0.08 },
    { dx: 0.25, dy: 0.75, w: 0.08, h: 0.08 },
    { dx: 0.75, dy: 0.75, w: 0.08, h: 0.08 },
  ]},
  { name: 'Barriers', obstacles: [
    { dx: 0.2, dy: 0.5, w: 0.2, h: 0.05 },
    { dx: 0.6, dy: 0.5, w: 0.2, h: 0.05 },
  ]},
  { name: 'Cross', obstacles: [
    { dx: 0.5, dy: 0.3, w: 0.05, h: 0.15 },
    { dx: 0.5, dy: 0.55, w: 0.05, h: 0.15 },
    { dx: 0.3, dy: 0.5, w: 0.15, h: 0.05 },
    { dx: 0.55, dy: 0.5, w: 0.15, h: 0.05 },
  ]},
];

// Applica template a una stanza, ritorna array di ostacoli in world coordinates
export function applyTemplate(room, template, tileSize) {
  const roomPx = { x: room.x * tileSize, y: room.y * tileSize, w: room.w * tileSize, h: room.h * tileSize };
  return template.obstacles.map(o => ({
    x: roomPx.x + o.dx * roomPx.w - (o.w * roomPx.w) / 2,
    y: roomPx.y + o.dy * roomPx.h - (o.h * roomPx.h) / 2,
    w: o.w * roomPx.w,
    h: o.h * roomPx.h,
  }));
}
