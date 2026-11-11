import { SKILL_META } from "./data.js";
import { skillLabel } from "./copy.js";
import { QUICK_HUD_KEYS, hubSkillsAllowed, quickSkills } from "./quick-bar.js";
import { paintUiArt } from "./ui-art.js";

const COPY = {
  zh: { pause: "暂停", resume: "继续", bag: "背包", moveDodge: "闪避" },
  en: { pause: "Pause", resume: "Resume", bag: "Bag", moveDodge: "Dodge" },
  ja: { pause: "一時停止", resume: "続ける", bag: "装備", moveDodge: "回避" },
};
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Circular deadzone and magnitude clamp preserve slow movement and equal diagonal speed.
export function joystickVector(clientX, clientY, rect, deadzone = 0.15) {
  const radius = Math.min(rect.width, rect.height) * 0.45;
  if (radius <= 0) return { x: 0, y: 0 };
  const x = (clientX - rect.left - rect.width / 2) / radius;
  const y = (clientY - rect.top - rect.height / 2) / radius;
  const length = Math.hypot(x, y);
  if (length <= deadzone) return { x: 0, y: 0 };
  const strength = (Math.min(length, 1) - deadzone) / (1 - deadzone);
  return { x: x / length * strength, y: y / length * strength };
}

export function createTouchControls(game) {
  const root = document.querySelector("#touch-controls");
  if (!root) return { sync() {}, reset() {}, active: false };
  const tools = document.querySelector("#game-tools");
  const joystick = root.querySelector("[data-touch-joystick]");
  const knob = joystick.querySelector("span");
  const skills = root.querySelector("[data-touch-skills]");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  // A public preview switch also lets desktop users try the touch layout.
  const forceTouch = new URLSearchParams(window.location.search).get("controls") === "touch";
  let lastInputWasTouch = false, joystickId = null, renderedKit = "";
  let slotButtons = [], moveButton = null;
  const menuButtons = [...(tools?.querySelectorAll("button") ?? [])];
  const pressed = new Map();
  const active = () => forceTouch || coarsePointer.matches || lastInputWasTouch;
  const playing = () => game.state === "playing"
    && game.hero.alive && game.phase !== "travel";
  const walking = () => playing() || (game.state === "camp" && game.hubActive
    && !game.campMenuOpen && !game._hubDepartPending);
  const arenaCombat = () => playing() || hubSkillsAllowed(game);
  const barSkills = () => quickSkills(game.hero.classId);
  const barSkillAt = (slot) => barSkills()[slot];

  function resetJoystick() {
    const id = joystickId;
    joystickId = null;
    game.touchMove = { x: 0, y: 0 };
    knob.style.transform = "translate(-50%, -50%)";
    if (id != null && joystick.hasPointerCapture(id)) joystick.releasePointerCapture(id);
  }
  function reset() {
    resetJoystick();
    for (const button of pressed.values()) button.classList.remove("is-pressed");
    pressed.clear();
    game.touchAttackHeld = false;
  }
  function move(event) {
    const vector = joystickVector(event.clientX, event.clientY, joystick.getBoundingClientRect());
    game.touchMove = vector;
    knob.style.transform = `translate(calc(-50% + ${vector.x * 34}px), calc(-50% + ${vector.y * 34}px))`;
  }
  joystick.addEventListener("pointerdown", (event) => {
    if (!walking() || joystickId != null || event.button !== 0) return;
    event.preventDefault();
    game.audio.unlock();
    joystickId = event.pointerId;
    joystick.setPointerCapture(joystickId);
    move(event);
  });
  joystick.addEventListener("pointermove", (event) => {
    if (event.pointerId === joystickId && walking()) { event.preventDefault(); move(event); }
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    joystick.addEventListener(type, (event) => { if (event.pointerId === joystickId) resetJoystick(); });
  }

  root.addEventListener("click", event => {
    // Keyboard activation generates a click without pointerdown.
    const button = event.target.closest("[data-touch-slot], [data-touch-move]");
    if (event.detail !== 0 || !button || button.disabled) return;
    game.audio.unlock();
    if (button.hasAttribute("data-touch-move")) { if (walking()) game.hero.tryMoveDodge(game); }
    else if (arenaCombat()) game.castQuick(barSkillAt(Number(button.dataset.touchSlot)));
  });
  root.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled || event.button !== 0) return;
    const canAct = button.hasAttribute("data-touch-move") ? walking() : arenaCombat();
    if (!canAct) return;
    event.preventDefault();
    game.audio.unlock();
    pressed.set(event.pointerId, button);
    button.classList.add("is-pressed");
    button.setPointerCapture(event.pointerId);
    const slot = Number(button.dataset.touchSlot);
    if (button.hasAttribute("data-touch-move")) game.hero.tryMoveDodge(game);
    if (button.hasAttribute("data-touch-slot") && slot === 0) game.touchAttackHeld = true;
    if (button.hasAttribute("data-touch-slot")) game.castQuick(barSkillAt(slot));
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    root.addEventListener(type, (event) => {
      const button = pressed.get(event.pointerId);
      if (button) { button.classList.remove("is-pressed"); pressed.delete(event.pointerId); }
      game.touchAttackHeld = [...pressed.values()].some((b) => b.hasAttribute("data-touch-slot") && Number(b.dataset.touchSlot) === 0);
    });
  }

  function activateMenu(button) {
    if (button.disabled) return;
    reset(); game.audio.unlock();
    if (button.dataset.gameAction === "bag" && game.state === "playing") game.toggleInventory();
    else if (button.dataset.gameAction === "bag" && game.state === "camp") game.toggleHubBag?.();
    else if (button.dataset.gameAction === "pause" && ["playing", "paused"].includes(game.state)) game.togglePause();
    sync();
  }
  // Touch down is reliable even when another finger owns the joystick. Do not wait for
  // Safari's compatibility click; suppress that click if it follows the same touch.
  const pendingMenuClicks = new WeakSet();
  tools?.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("[data-game-action]");
    if (button && event.pointerType === "mouse") pendingMenuClicks.delete(button);
    if (!["touch", "pen"].includes(event.pointerType) || event.button !== 0) return;
    if (!button || button.disabled) return;
    event.preventDefault();
    pendingMenuClicks.add(button);
    activateMenu(button);
  });
  tools?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-game-action]");
    if (!button) return;
    if (pendingMenuClicks.has(button) && (["touch", "pen"].includes(event.pointerType) || event.detail > 0)) {
      pendingMenuClicks.delete(button);
      event.preventDefault();
      return;
    }
    activateMenu(button);
  });

  function sync() {
    const language = game.language ?? "zh", copy = COPY[language] ?? COPY.zh;
    root.hidden = !walking();
    // The shared move/dodge button stays available for hub walking; skill buttons hide instead.
    skills.classList.toggle("is-camp", game.state === "camp" && !hubSkillsAllowed(game));
    root.classList.toggle("is-touch", active());
    tools?.classList.toggle("is-touch", active());
    if (!walking() || !active()) reset();
    if (tools) {
      const hub = game.state === "camp" && game.hubActive && !game.campMenuOpen && !game._hubDepartPending;
      tools.hidden = !["playing", "paused"].includes(game.state) && !hub;
      const pause = tools.querySelector('[data-game-action="pause"]');
      pause.hidden = hub;
      const label = game.state === "paused" ? copy.resume : copy.pause;
      pause.setAttribute("aria-label", label); pause.title = `${label} · P`;
      pause.classList.toggle("is-paused", game.state === "paused");
      const bag = tools.querySelector('[data-game-action="bag"]');
      bag.disabled = !(playing() || hub); bag.title = `${copy.bag} · Tab/B`; bag.setAttribute("aria-label", copy.bag);
    }
    const kit = `${language}:${game.hero.classId}`;
    if (kit !== renderedKit) {
      // Rebuilt buttons detach any pressed pointers; drop stale hold state first.
      reset();
      renderedKit = kit;
      skills.innerHTML = barSkills().map((id, index) => {
        const skill = SKILL_META.find((s) => s.id === id) ?? SKILL_META[0];
        const name = skillLabel(game, skill);
        const key = QUICK_HUD_KEYS[index] ?? String(index + 1);
        return `<button type="button" class="touch-skill" style="--skill-color:${skill.tint ?? "#ffe7a5"}" data-touch-slot="${index}" aria-label="${escapeHtml(name)}" title="${escapeHtml(name)} · ${key}"><canvas class="ui-art" aria-hidden="true"></canvas><small class="touch-glyph">${escapeHtml(skill.glyph ?? name.slice(0, 1))}</small><span class="touch-key" aria-hidden="true">${key}</span><span class="touch-cooldown" aria-hidden="true"></span></button>`;
      }).join("") + `<button type="button" class="touch-skill touch-move" data-touch-move aria-label="${escapeHtml(copy.moveDodge)}"><canvas class="ui-art" aria-hidden="true"></canvas><small class="touch-glyph">${escapeHtml(copy.moveDodge)}</small><span class="touch-key" aria-hidden="true">空格</span><span class="touch-cooldown" aria-hidden="true"></span></button>`;
      slotButtons = [...skills.querySelectorAll("[data-touch-slot]")];
      moveButton = skills.querySelector("[data-touch-move]");
    }
    slotButtons.forEach((button, index) => {
      const id = barSkillAt(index), skill = SKILL_META.find((s) => s.id === id);
      const left = game.hero.cd[id] ?? 0;
      // Attack must keep receiving pointerdown during recovery so taps can enter its buffer.
      button.disabled = !arenaCombat() || (index !== 0 && left > 0) || game.hero.mp < (skill?.cost ?? 0);
      button.classList.toggle("is-cooling", left > 0);
      button.querySelector(".touch-cooldown").textContent = left > 0 ? (left >= 1 ? String(Math.ceil(left)) : left.toFixed(1)) : "";
    });
    if (moveButton) {
      moveButton.disabled = !walking() || game.hero.dashT > 0;
      const dashLeft = game.hero.dashCd;
      moveButton.querySelector(".touch-cooldown").textContent = dashLeft > 0 ? (dashLeft >= 1 ? String(Math.ceil(dashLeft)) : dashLeft.toFixed(1)) : "";
    }
    // Shared cached artwork animates at 10 fps; input continues at the game's full frame rate.
    const time = game.ui.t;
    for (const button of menuButtons) {
      if (tools.hidden) continue;
      const icon = button.dataset.gameAction === "pause" && game.state === "paused" ? "resume" : button.dataset.gameAction;
      paintUiArt(button.querySelector("canvas"), "action", { icon, disabled: button.disabled, hud: true }, time);
    }
    if (root.hidden) return;
    if (moveButton) paintUiArt(moveButton.querySelector("canvas"), "action", {
      icon: "dodge", hud: true,
      cooldown: Math.round(game.hero.dashCd / game.hero.dashMax * 20) / 20,
      disabled: moveButton.disabled, pressed: moveButton.classList.contains("is-pressed"),
      flash: game.ui.actionPulse.id === "dodge" && game.ui.actionPulse.t > 0,
    }, time);
    if (game.state === "camp" && !hubSkillsAllowed(game)) return;
    slotButtons.forEach((button, index) => {
      const id = barSkillAt(index), s = SKILL_META.find(s => s.id === id) ?? SKILL_META[0];
      const left = game.hero.cd[id] ?? 0, lacksMana = game.hero.mp < s.cost;
      paintUiArt(button.querySelector("canvas"), "skill", {
        icon: s.icon, hud: true, cooldown: Math.round(Math.min(1, left / (id === "j" ? game.hero.meleeCooldownMax : s.cd)) * 20) / 20,
        disabled: lacksMana, mana: lacksMana ? 0 : 1, pressed: button.classList.contains("is-pressed"),
        selected: (game.ui.pulse[id] ?? 0) > 0,
      }, time);
    });
  }
  window.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") { lastInputWasTouch = true; sync(); }
  }, { capture: true });
  window.addEventListener("blur", reset);
  window.addEventListener("resize", reset);
  document.addEventListener("visibilitychange", () => { if (document.hidden) reset(); });
  coarsePointer.addEventListener("change", () => { reset(); sync(); });
  sync();
  return { sync, reset, get active() { return active(); } };
}
