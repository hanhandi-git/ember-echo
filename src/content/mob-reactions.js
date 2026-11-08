// Pixelfx mob units read pose cues through effect options (see pixelfx docs/FANTASY.md).

export function clearMobPoseOptions(opts) {
  delete opts.pose;
  delete opts.cast;
  delete opts.poseT;
  delete opts.poseDur;
  delete opts.poseWindup;
  delete opts.poseHold;
  delete opts.poseRecover;
  delete opts.hurtDir;
}

export function syncMobPoseOptions(enemy) {
  const react = enemy.type?.mobReact;
  const opts = enemy.fx?.options;
  if (!react || !opts) return;
  const { poseState, poseT, hurtDir } = enemy;
  if (poseState === "cast") {
    opts.pose = "cast";
    opts.cast = react.cast;
    opts.poseT = poseT;
    opts.poseWindup = react.poseWindup;
    opts.poseHold = react.poseHold;
    opts.poseRecover = react.poseRecover;
    return;
  }
  if (poseState === "hurt") {
    opts.pose = "hurt";
    opts.poseT = poseT;
    opts.poseDur = react.hurtFor;
    opts.hurtDir = hurtDir ?? -1;
    return;
  }
  if (poseState === "die") {
    opts.pose = "die";
    opts.poseT = poseT;
    opts.poseDur = react.dieFor;
    return;
  }
  clearMobPoseOptions(opts);
}

export function mobCastHitAt(react) {
  return react.poseWindup + react.poseHold;
}

export function mobCastEndAt(react) {
  return mobCastHitAt(react) + react.poseRecover;
}
