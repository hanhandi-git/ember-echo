// Safari can resize its visual viewport for browser chrome OR page zoom. Normalize zoom
// out of the measurements so a gesture never feeds a smaller viewport back into canvas layout.
export function viewportSize(win) {
  const viewport = win.visualViewport;
  const scale = viewport?.scale > 0 ? viewport.scale : 1;
  return {
    width: Math.round((viewport?.width || win.innerWidth) * (viewport?.width ? scale : 1)),
    height: Math.round((viewport?.height || win.innerHeight) * (viewport?.height ? scale : 1)),
  };
}

export function installGameViewport(stage, win = window) {
  const doc = stage.ownerDocument;
  const panel = stage.querySelector("#settings-panel");
  let frame = null, rotationTimer = null, lastTap = null;
  const subscriptions = [];
  function listen(target, type, handler, options) {
    if (!target) return;
    target.addEventListener(type, handler, options);
    subscriptions.push(() => target.removeEventListener(type, handler, options));
  }
  function update() {
    frame = null;
    const { width, height } = viewportSize(win);
    if (width <= 0 || height <= 0) return;
    const style = doc.documentElement.style;
    for (const [key, value] of [["--app-width", `${width}px`], ["--app-height", `${height}px`]]) {
      if (style.getPropertyValue(key) !== value) style.setProperty(key, value);
    }
  }
  function schedule() { if (frame == null) frame = win.requestAnimationFrame(update); }
  function rotate() {
    lastTap = null;
    schedule();
    // Some Safari versions deliver orientationchange before their final viewport size.
    win.clearTimeout(rotationTimer);
    rotationTimer = win.setTimeout(schedule, 250);
  }
  const inGame = (event) => {
    if (panel && !panel.hidden) return false;
    const target = event.target;
    return target === doc || target === doc.body || target === doc.documentElement || stage.contains(target);
  };
  const prevent = (event) => { if (event.cancelable && inGame(event)) event.preventDefault(); };

  // Cover the whole play area, including gaps, disabled cooldown buttons and SVG children.
  // Blocking only canvas touchmove leaves multi-touch gestures starting in those gaps unhandled.
  for (const type of ["gesturestart", "gesturechange", "gestureend", "dblclick"]) {
    listen(doc, type, prevent, { capture: true, passive: false });
  }
  listen(doc, "touchmove", prevent, { capture: true, passive: false });
  listen(doc, "touchend", (event) => {
    if (!inGame(event) || event.touches.length || event.changedTouches.length !== 1) { lastTap = null; return; }
    // Pointer controls already act on down. Keep real buttons' native click for pause/backpack.
    if (event.target.closest?.("button")) { lastTap = null; return; }
    const touch = event.changedTouches[0];
    if (lastTap && event.timeStamp - lastTap.time < 300 &&
      Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < 28 && event.cancelable) event.preventDefault();
    lastTap = { time: event.timeStamp, x: touch.clientX, y: touch.clientY };
  }, { capture: true, passive: false });
  listen(doc, "touchcancel", () => { lastTap = null; });
  listen(win, "resize", schedule);
  listen(win, "orientationchange", rotate);
  listen(win.screen?.orientation, "change", rotate);
  listen(win.visualViewport, "resize", schedule);
  listen(win.visualViewport, "scroll", schedule);
  update();

  return () => {
    subscriptions.forEach((remove) => remove());
    if (frame != null) win.cancelAnimationFrame(frame);
    win.clearTimeout(rotationTimer);
  };
}
