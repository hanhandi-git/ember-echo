import { SKILL_META } from "./data.js";

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
  let lastInputWasTouch = false, joystickId = null, renderedKit = "", renderedLanguage = "";
  let slotButtons = [];
  const pressed = new Map();
  const active = () => coarsePointer.matches || lastInputWasTouch;
  const playing = () => game.state === "playing" && game.hero.alive && game.phase !== "travel";

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
  }
  function move(event) {
    const vector = joystickVector(event.clientX, event.clientY, joystick.getBoundingClientRect());
    game.touchMove = vector;
    knob.style.transform = `translate(calc(-50% + ${vector.x * 28}px), calc(-50% + ${vector.y * 28}px))`;
  }
  joystick.addEventListener("pointerdown", (event) => {
    if (!playing() || joystickId != null || event.button !== 0) return;
    event.preventDefault();
    game.audio.unlock();
    joystickId = event.pointerId;
    joystick.setPointerCapture(joystickId);
    move(event);
  });
  joystick.addEventListener("pointermove", (event) => {
    if (event.pointerId === joystickId && playing()) { event.preventDefault(); move(event); }
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    joystick.addEventListener(type, (event) => { if (event.pointerId === joystickId) resetJoystick(); });
  }
  root.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled || event.button !== 0 || !playing()) return;
    event.preventDefault();
    game.audio.unlock();
    pressed.set(event.pointerId, button);
    button.classList.add("is-pressed");
    button.setPointerCapture(event.pointerId);
    if (button.hasAttribute("data-touch-slot")) game.cast(game.hero.skillSlots[Number(button.dataset.touchSlot)]);
    else if (button.dataset.touchAction === "quick") game.hero.tryQuickMove(game);
    else if (button.dataset.touchAction === "dodge") game.hero.tryDash(game);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    root.addEventListener(type, (event) => {
      const button = pressed.get(event.pointerId);
      if (button) { button.classList.remove("is-pressed"); pressed.delete(event.pointerId); }
    });
  }

  // Menu actions use click so mouse, touch and native keyboard button activation all work.
  tools?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-game-action]");
    if (!button) return;
    reset(); game.audio.unlock();
    if (button.dataset.gameAction === "bag" && game.state === "playing") game.toggleInventory();
    else if (button.dataset.gameAction === "pause" && ["playing", "paused"].includes(game.state)) game.togglePause();
    sync();
  });

  function sync() {
    const language = game.language ?? "zh", copy = COPY[language] ?? COPY.zh;
    root.hidden = !active() || !playing();
    if (!playing() || !active()) reset();
    if (tools) {
      tools.hidden = !active() || !["playing", "paused"].includes(game.state);
      const pause = tools.querySelector('[data-game-action="pause"]');
      const label = game.state === "paused" ? copy.resume : copy.pause;
      pause.setAttribute("aria-label", label); pause.title = `${label} · P`;
      pause.classList.toggle("is-paused", game.state === "paused");
      const bag = tools.querySelector('[data-game-action="bag"]');
      bag.disabled = !playing(); bag.title = `${copy.bag} · Tab`; bag.setAttribute("aria-label", copy.bag);
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
        const name = language === "ja" ? skill.nameJa ?? skill.nameEn : language === "en" ? skill.nameEn : skill.name;
        return `<button type="button" class="touch-skill" style="--skill-color:${skill.tint ?? "#ffe7a5"}" data-touch-slot="${index}" aria-label="${escapeHtml(name)}"><span class="touch-glyph">${escapeHtml(skill.glyph)}</span><small>${escapeHtml(name)}</small><span class="touch-cooldown"></span></button>`;
      }).join("");
      slotButtons = [...skills.querySelectorAll("button")];
    }
    slotButtons.forEach((button, index) => {
      const id = game.hero.skillSlots[index], skill = SKILL_META.find((s) => s.id === id);
      const left = game.hero.cd[id] ?? 0;
      button.disabled = !playing() || left > 0 || game.hero.mp < (skill?.cost ?? 0);
      button.classList.toggle("is-cooling", left > 0);
      button.querySelector(".touch-cooldown").textContent = left > 0 ? (left >= 1 ? String(Math.ceil(left)) : left.toFixed(1)) : "";
    });
    const dodge = root.querySelector('[data-touch-action="dodge"]');
    // A tap during cooldown is buffered for the next ready frame, so mobile timing is forgiving.
    dodge.disabled = !playing() || game.hero.dashT > 0;
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
