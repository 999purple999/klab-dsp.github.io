class EventBusClass {
  constructor() {
    this._listeners = {};
    this._blocked = {};
  }

  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }

  off(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(fn => fn !== cb);
  }

  emit(event, data) {
    if (this._blocked[event]) return;
    if (!this._listeners[event]) return;
    // Iterate a copy in case callbacks modify the list
    const list = this._listeners[event].slice();
    for (const cb of list) cb(data);
  }

  block(event) {
    this._blocked[event] = true;
  }

  unblock(event) {
    delete this._blocked[event];
  }

  clear() {
    this._listeners = {};
    this._blocked = {};
  }
}

export const EventBus = new EventBusClass();
