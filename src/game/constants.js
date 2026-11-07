/** Viewport, world bounds and shared palette tokens for rendering systems. */
import { hex } from "../../../pixelfx/src/core/index.js";

export const SW = 320;
export const SH = 180;
export const BH = 180;
export const WORLD_W = 480;

export const PALETTE = {
  ink: hex("#07060d"),
  white: 0xffffffff,
  bg: hex("#05060c"),
  warn: hex("#ff8a5a"),
  warnLit: hex("#ffd36a"),
  gold: hex("#ffd36a"),
  green: hex("#a8ff9a"),
};

/** Floating hit numbers: normal 1×, crit 1.5× (milestone combo UI is separate). */
export const NUM_FONT_SCALE = { normal: 1, crit: 1.5 };
