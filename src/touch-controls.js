import { SKILL_META } from "./data.js";
import { SKILL_KEYS } from "./controls.js";
import { skillLabel } from "./copy.js";
import { paintUiArt } from "./ui-art.js";

const COPY = {
  zh: { quick: "快移", dodge: "闪避", pause: "暂停", resume: "继续", bag: "背包" },
  en: { quick: "Move", dodge: "Dodge", pause: "Pause", resume: "Resume", bag: "Bag" },
  ja: { quick: "移動", dodge: "回避", pause: "一時停止", resume: "続ける", bag: "装備" },
};
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Circular deadzone and magnitude clamp preserve slow movement and equal diagonal speed.
export function joystickVector(clientX, clientY, rect, deadzone = 0.2) {
  const radius = Math.min(rect.width, rect.height) * 0.42;
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
  let lastInputWasTouch = false, joystickId = null, renderedKit = "", renderedLanguage = "";
  let slotButtons = [];
  const menuButtons = [...(tools?.querySelectorAll("button") ?? [])];
  const actionButtons = [...root.querySelectorAll("[data-touch-action]")];
  const pressed = new Map();
  const active = () => forceTouch || coarsePointer.matches || lastInputWasTouch;
  const playing = () => game.state === "playing"
    && game.hero.alive && game.phase !== "travel";
  const trainingArena = () => game.state === "camp" && game.hubZone === "arena" && game.hubActive
    && !game.campMenuOpen && !game._hubDepartPending;
  const walking = () => playing() || (game.state === "camp" && game.hubActive
    && !game.campMenuOpen && !game._hubDepartPending);
  const arenaCombat = () => playing() || trainingArena();

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
    knob.style.transform = `translate(calc(-50% + ${vector.x * 28}px), calc(-50% + ${vector.y * 28}px))`;
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
    const button = event.target.closest("[data-touch-slot]");
    if (event.detail === 0 && button && !button.disabled && arenaCombat()) {
      game.audio.unlock(); game.cast(game.hero.skillSlots[Number(button.dataset.touchSlot)]);
    }
  });
  root.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("button");
    const touchHub = walking();
    if (!button || button.disabled || event.button !== 0 || (!arenaCombat() && !touchHub)) return;
    event.preventDefault();
    game.audio.unlock();
    pressed.set(event.pointerId, button);
    button.classList.add("is-pressed");
    button.setPointerCapture(event.pointerId);
    if (button.hasAttribute("data-touch-slot") && ["j", "mage:bolt"].includes(game.hero.skillSlots[Number(button.dataset.touchSlot)])) game.touchAttackHeld = true;
    if (button.hasAttribute("data-touch-slot") && arenaCombat()) game.cast(game.hero.skillSlots[Number(button.dataset.touchSlot)]);
    else if (button.dataset.touchAction === "quick" && walking()) game.hero.tryQuickMove(game);
    else if (button.dataset.touchAction === "dodge" && playing()) game.hero.tryDash(game);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    root.addEventListener(type, (event) => {
      const button = pressed.get(event.pointerId);
      if (button) { button.classList.remove("is-pressed"); pressed.delete(event.pointerId); }
      game.touchAttackHeld = [...pressed.values()].some((b) => b.hasAttribute("data-touch-slot") && ["j", "mage:bolt"].includes(game.hero.skillSlots[Number(b.dataset.touchSlot)]));
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
    skills.hidden = game.state === "camp" && !trainingArena();
    for (const button of actionButtons) {
      const action = button.dataset.touchAction;
      button.hidden = game.state === "camp" && (action !== "quick" ? !trainingArena() : false);
    }
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
    if (language !== renderedLanguage) {
      root.querySelectorAll("[data-touch-action]").forEach((button) => {
        const label = copy[button.dataset.touchAction];
        button.setAttribute("aria-label", label); button.querySelector("small").textContent = label;
      });
      renderedLanguage = language;
    }
    const kit = `${language}:${game.hero.skillSlots.join("|")}`;
    if (kit !== renderedKit) {
      renderedKit = kit;
      skills.innerHTML = game.hero.skillSlots.map((id, index) => {
        const skill = SKILL_META.find((s) => s.id === id) ?? SKILL_META[0];
        const name = skillLabel(game, skill);
        const key = SKILL_KEYS[index] ?? String(index + 1);
        return `<button type="button" class="touch-skill" style="--skill-color:${skill.tint ?? "#ffe7a5"}" data-touch-slot="${index}" aria-label="${escapeHtml(name)}" title="${escapeHtml(name)} · ${key}"><canvas class="ui-art" aria-hidden="true"></canvas><small class="touch-glyph">${escapeHtml(skill.glyph ?? name.slice(0, 1))}</small><span class="touch-key" aria-hidden="true">${key}</span><span class="touch-cooldown" aria-hidden="true"></span></button>`;
      }).join("");
      slotButtons = [...skills.querySelectorAll("button")];
    }
    slotButtons.forEach((button, index) => {
      const id = game.hero.skillSlots[index], skill = SKILL_META.find((s) => s.id === id);
      const left = game.hero.cd[id] ?? 0;
      // Slash must keep receiving pointerdown during recovery so taps can enter its buffer.
      button.disabled = !arenaCombat() || (id !== "j" && left > 0) || game.hero.mp < (skill?.cost ?? 0);
      button.classList.toggle("is-cooling", left > 0);
      button.querySelector(".touch-cooldown").textContent = left > 0 ? (left >= 1 ? String(Math.ceil(left)) : left.toFixed(1)) : "";
    });
    const dodge = root.querySelector('[data-touch-action="dodge"]');
    // A tap during cooldown is buffered for the next ready frame, so mobile timing is forgiving.
    dodge.disabled = !playing() || game.hero.dashT > 0;
    // Shared cached artwork animates at 10 fps; input continues at the game's full frame rate.
    const time = game.ui.t;
    for (const button of menuButtons) {
      if (tools.hidden) continue;
      const icon = button.dataset.gameAction === "pause" && game.state === "paused" ? "resume" : button.dataset.gameAction;
      paintUiArt(button.querySelector("canvas"), "action", { icon, disabled: button.disabled, hud: true }, time);
    }
    if (root.hidden || (game.state === "camp" && !trainingArena())) return;
    slotButtons.forEach((button, index) => {
      const id = game.hero.skillSlots[index], s = SKILL_META.find(s => s.id === id) ?? SKILL_META[0];
      const left = game.hero.cd[id] ?? 0, lacksMana = game.hero.mp < s.cost;
      paintUiArt(button.querySelector("canvas"), "skill", {
        icon: s.icon, hud: true, cooldown: Math.round(Math.min(1, left / (id === "j" ? game.hero.meleeCooldownMax : s.cd)) * 20) / 20,
        disabled: lacksMana, mana: lacksMana ? 0 : 1, pressed: button.classList.contains("is-pressed"),
        selected: (game.ui.pulse[id] ?? 0) > 0,
      }, time);
    });
    if (active()) for (const button of actionButtons) {
      const icon = button.dataset.touchAction;
      paintUiArt(button.querySelector("canvas"), "action", {
        icon, hud: true, cooldown: icon === "dodge" ? Math.round(game.hero.dashCd / game.hero.dashMax * 20) / 20 : 0,
        disabled: button.disabled, pressed: button.classList.contains("is-pressed"),
        flash: game.ui.actionPulse.id === icon && game.ui.actionPulse.t > 0,
      }, time);
    }
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
