// ─── EventBus ─────────────────────────────────────────────────────────────────
// Simple pub/sub event bus for decoupled module communication.

const _listeners = {};

export const EventBus = {
  on(event, cb) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(cb);
  },
  off(event, cb) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(fn => fn !== cb);
  },
  emit(event, data) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(fn => fn(data));
  },
};
