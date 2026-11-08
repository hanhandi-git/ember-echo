import { test } from "node:test";
import assert from "node:assert/strict";
import { installGameViewport, viewportSize, gameCanvasScale, layoutGameCanvas } from "../src/viewport.js";

function fixture() {
  const target = () => ({
    listeners: new Map(),
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); },
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); },
    emit(type, data = {}) {
      const event = { cancelable: true, target: this, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; }, ...data };
      for (const fn of this.listeners.get(type) ?? []) fn(event);
      return event;
    },
  });
  const values = new Map(), frames = new Map(), timers = new Map();
  let id = 0;
  const doc = Object.assign(target(), { body: {}, documentElement: { style: {
    getPropertyValue: (key) => values.get(key), setProperty: (key, value) => values.set(key, value),
  } } });
  const viewport = Object.assign(target(), { width: 844, height: 390, scale: 1 });
  const win = Object.assign(target(), {
    innerWidth: 844, innerHeight: 390, visualViewport: viewport,
    requestAnimationFrame(fn) { frames.set(++id, fn); return id; },
    cancelAnimationFrame(key) { frames.delete(key); },
    setTimeout(fn) { timers.set(++id, fn); return id; }, clearTimeout(key) { timers.delete(key); },
  });
  const panel = { hidden: true };
  const gameCanvas = { closest: () => null, style: {} };
  const canvas = { closest: () => null }, disabledButton = { closest: () => ({}) }, gap = {};
  const stage = {
    ownerDocument: doc,
    querySelector: (sel) => (sel === "#settings-panel" ? panel : sel === "#game" ? gameCanvas : null),
    contains: (node) => [canvas, disabledButton, gap].includes(node),
  };
  const dispose = installGameViewport(stage, win);
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach((fn) => fn()); };
  return { win, doc, viewport, panel, canvas, disabledButton, gap, values, frames, timers, flush, dispose };
}

test("game canvas uses an integer upscale so HUD pixels are not softened", () => {
  assert.equal(gameCanvasScale(844, 390), 2);
  assert.equal(gameCanvasScale(1280, 800), 4);
  assert.equal(gameCanvasScale(400, 225), 1);
  const canvas = { style: {} };
  assert.equal(layoutGameCanvas(canvas, 844, 390), 2);
  assert.equal(canvas.style.width, "640px");
  assert.equal(canvas.style.height, "360px");
});

test("viewport sizing accounts for browser chrome without feeding pinch zoom back into layout", () => {
  assert.deepEqual(viewportSize({ innerWidth: 844, innerHeight: 390 }), { width: 844, height: 390 });
  const f = fixture();
  assert.equal(f.values.get("--app-height"), "390px");
  Object.assign(f.viewport, { width: 422, height: 195, scale: 2 });
  f.viewport.emit("resize"); f.flush();
  assert.equal(f.values.get("--app-width"), "844px");
  assert.equal(f.values.get("--app-height"), "390px");
  Object.assign(f.viewport, { width: 844, height: 340, scale: 1 });
  f.viewport.emit("resize"); f.flush();
  assert.equal(f.values.get("--app-height"), "340px");
  Object.assign(f.viewport, { width: 390, height: 844 });
  f.win.emit("orientationchange"); f.flush();
  assert.equal(f.values.get("--app-width"), "390px");
  assert.equal(f.values.get("--app-height"), "844px");
  f.dispose();
});

test("Safari zoom and pan are blocked across the entire play surface, including gaps and disabled buttons", () => {
  const f = fixture();
  for (const type of ["gesturestart", "gesturechange", "gestureend", "dblclick", "touchmove"]) {
    for (const target of [f.canvas, f.disabledButton, f.gap, f.doc, f.doc.body]) {
      assert.equal(f.doc.emit(type, { target }).defaultPrevented, true, type);
    }
    assert.equal(f.doc.emit(type, { target: f.canvas, cancelable: false }).defaultPrevented, false);
  }
  f.panel.hidden = false;
  assert.equal(f.doc.emit("touchmove", { target: f.canvas }).defaultPrevented, false, "backpack keeps native scrolling");
  assert.equal(f.doc.emit("gesturestart", { target: f.canvas }).defaultPrevented, false);
  f.dispose();
});

test("double-tap fallback preserves menu button clicks and multi-finger releases", () => {
  const f = fixture();
  const tap = (target, timeStamp, touches = []) => f.doc.emit("touchend", {
    target, timeStamp, touches, changedTouches: [{ clientX: 50, clientY: 100 }],
  });
  assert.equal(tap(f.canvas, 1000).defaultPrevented, false);
  assert.equal(tap(f.canvas, 1150).defaultPrevented, true);
  assert.equal(tap(f.disabledButton, 1200).defaultPrevented, false, "do not swallow pause/resume click");
  assert.equal(tap(f.canvas, 1250, [{}]).defaultPrevented, false);
  assert.equal(tap(f.canvas, 1300).defaultPrevented, false);
  f.dispose();
});

test("viewport events are coalesced and disposed without leaving callbacks behind", () => {
  const f = fixture();
  f.win.emit("resize"); f.viewport.emit("resize"); f.viewport.emit("scroll");
  assert.equal(f.frames.size, 1);
  f.win.emit("orientationchange");
  f.dispose();
  assert.equal(f.frames.size, 0);
  assert.equal(f.timers.size, 0);
  assert.ok([...f.doc.listeners.values(), ...f.win.listeners.values(), ...f.viewport.listeners.values()].every((set) => set.size === 0));
});

test("pointer input stays in world units on a dense canvas", async () => {
  const { installPointer } = await import("../src/input/pointer.js");
  let onClick, point;
  const canvas = { width: 640, height: 360, addEventListener: (_name, fn) => { onClick = fn; },
    getBoundingClientRect: () => ({ left: 20, top: 30, width: 960, height: 540 }) };
  const game = { state: "playing", audio: { unlock() {} }, handlePointer: (x, y) => { point = [x, y]; return true; } };
  installPointer(game, canvas);
  onClick({ clientX: 500, clientY: 300 });
  assert.deepEqual(point, [160, 90]);
});
