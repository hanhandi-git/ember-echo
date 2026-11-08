# 关卡与敌人配置说明

游戏内容由两份 JSON 驱动，加载逻辑在 `src/content/compose-content.js`。修改后执行 `npm run build`（开发中可用 `npm run dev`）使浏览器读到新配置；`npm test` 会校验波次里的 `type` 是否已在敌人表注册。

| 文件 | 用途 |
|------|------|
| `src/content/stages.config.json` | 关卡数量、文案、地图、每波刷怪 |
| `src/content/enemies.config.json` | 敌人类型 ID、**hp / attack / defense** 等战斗数值 |
| `src/content/pickups.config.json` | 击杀掉落概率与 **HP/MP/XP 奖励量** |

---

## 坐标：`x` / `y` 是什么？

波次里每条刷怪记录形如：

```json
{ "type": "slime", "x": 126, "y": 150 }
```

- **坐标系**：与角色、子弹、碰撞一致的**世界坐标**（不是 Canvas 上的 0–320 视口坐标）。
- **`x`**：水平位置，单位像素。有效范围大致 **0 ~ `WORLD_W`（480）**。摄像机跟随决斗者横向移动，所以 `x` 可以大于当前屏幕宽度 320，表示出现在右侧待探索区域。
- **`y`**：垂直位置，单位像素。画面逻辑高度为 **180**（`SH`）。地面与站立敌人通常在 **约 140–160**；飞行单位（`fly: true`）可略低或略高，但仍建议在 **130–165** 内微调，避免踩空或穿地。

出生时会按 `type` 创建敌人实例，`x/y` 直接写入其世界位置（见 `stage-flow.js` → `spawnEnemy`）。同一波内多条记录会按队列间隔约 **0.28 秒**依次出现，坐标仅决定**出现在哪里**，不决定先后顺序（顺序由数组先后决定）。

---

## `stages.config.json`

根对象：

| 字段 | 类型 | 含义 |
|------|------|------|
| `version` | number | 配置版本号，预留迁移用；当前为 `1`。 |
| `stages` | array | 关卡列表，**顺序即通关顺序**（第 1 项为最初关卡）。 |

每个 **stage** 对象：

| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | string | 稳定内部 ID（如 `mossy-ruins`），便于工具/文档引用，运行时标题以 `name` 为准。 |
| `act` | string | 幕名（中文 UI，如「第一幕」）。 |
| `name` | string | 关卡名（中文）。 |
| `sub` | string | 关卡副标题（中文）。 |
| `chapter` | string | 章节罗马数字等，HUD 用。 |
| `actEn` | string | 幕名（英文/像素 HUD）。 |
| `nameEn` | string | 关卡名（英文）。 |
| `subEn` | string | 副标题（英文）。 |
| `map` | string | 地图资源键，在 `compose-content.js` 的 `MAP_BY_KEY` 中解析为 pixelfx 地图模块。可选：`mossy`、`marsh`、`ember`、`aurora`、`crystal`、`inkbound`、`sunscar`。 |
| `palette` | string | 关卡主题色（十六进制），用于传送门等 UI 点缀。 |
| `waves` | array | **波次列表**。通关条件为清完当前波 → 下一波 → 三波清空后出现传送门。 |

**`waves` 结构**：

- 外层数组：每一关 **3 个元素**为常见设计（可改长度，逻辑会按 `waves.length` 推进）。
- 内层数组：该波要刷的敌人列表。
- 内层元素：

| 字段 | 类型 | 含义 |
|------|------|------|
| `type` | string | 敌人 ID，必须出现在 `enemies.config.json` 的 `types` 中（如 `slime`、`goblin-warrior`、`boss`）。 |
| `x` | number | 世界坐标 X，见上文。 |
| `y` | number | 世界坐标 Y，见上文。 |

**Boss 约定**：`type: "boss"` 表示本关 Boss 战（当前为第 3、7 关第 3 波）。Boss 数值在 `enemies.config.json` 的 `boss` 条目配置。

---

## `enemies.config.json`

根对象：

| 字段 | 类型 | 含义 |
|------|------|------|
| `version` | number | 配置版本，当前为 `1`。 |
| `types` | object | 键为 **type ID**（与波次里 `type` 一致），值为下列三类之一。 |

### 1. 小动物（`critter`）

用于史莱姆、蝙蝠等，形象来自 `fx-registry.js` 的 `CRITTER_MODS`。

| 字段 | 含义 |
|------|------|
| `critter` | 模块键：`slime`、`snake`、`frog`、`bat`、`wisp`、`ghost`、`eyeball`、`flyingSkull`（与注册表一致）。 |
| `name` | 中文显示名。 |
| `hp` | 生命值。 |
| `attack` | 攻击力（对玩家造成的伤害基准；运行时代码字段为 `dmg`）。 |
| `defense` | 防御力（**固定减伤**：受到的伤害 = max(1, 原始伤害 − defense)，再计算暴击）。 |
| `speed` | 移动速度（逻辑单位/秒量级）。 |
| `reach` | 攻击判定距离（逻辑像素，进战斗会乘 `COMBAT_SCALE`）。 |
| `want` | 渴求接战距离，略小于 `reach`，用于 AI 停步。 |
| `windup` | 攻击前摇（秒）。 |
| `cd` | 攻击冷却（秒）。 |
| `xp` | 击杀经验。 |
| `barH` | 血条高度参考（像素，会随渲染缩放）。 |
| `w` | 碰撞/显示宽度参考。 |
| `scale` | 像素人渲染缩放（再乘全局战斗缩放）。 |
| `fly` | 是否飞行单位（影响移动/高度感）。 |
| `ranged` | 可选，远程攻击。 |
| `shot` | 可选，远程弹道：`speed`、`r`、`color`、`palette`。 |
| `deathFx` | 死亡特效键：`poof` 或 `shatterDeath`。 |
| `overrides` | 可选对象，在组装后合并覆盖任意已生成字段（高级用法）。 |

### 2. 哥布林（`mob`）

行为与基础数值默认从 pixelfx 对应 `goblin-*.js` 的 `mob` 导出推导；JSON 主要改显示名，并可覆盖数值。

| 字段 | 含义 |
|------|------|
| `mob` | 与 type ID 相同：`goblin-warrior`、`goblin-agile`、`goblin-archer`、`goblin-mage`、`goblin-giant`。 |
| `name` / `nameEn` | 中/英显示名。 |
| `scale` | 可选，覆盖默认渲染缩放（巨人常用 `0.74`）。 |
| `hp` / `attack` / `defense` | 可选，直接写在条目上即可覆盖 pixelfx 推导值（不必只用 `overrides`）。 |
| `overrides` | 可选，合并覆盖任意已生成字段（高级用法）。 |

### 3. Boss（`boss: true`）

| 字段 | 含义 |
|------|------|
| `boss` | 必须为 `true`。 |
| `look` | 角色外观 ID（如 `styx-warden`）。 |
| `name` / `nameEn` | 名称。 |
| 其余 `hp`、`attack`、`defense`、`speed`、`reach`、`want`、`windup`、`cd`、`xp`、`barH`、`w`、`fly` | 与 critter 同义；Boss 使用专用 AI 类，见 `enemies.js` 中 `Boss`。 |
| `deathFx` | 常用 `shatterDeath`。 |

兼容：仍可用旧字段名 `dmg`，与 `attack` 等价；优先写 `attack`。

---

## `pickups.config.json`

小怪死亡时按概率掉落（Boss 不掉落）。`drops` 为数组，逐项加权随机：

| 字段 | 含义 |
|------|------|
| `p` | 权重概率（可与其它项叠加；未命中任何项则不掉落）。当前默认三项合计 `0.75`，约 25% 无掉落。 |
| `kind` | 逻辑类型：`heart` / `potion` / `xp`（影响拾取逻辑与自动拾取倾向）。 |
| `pickup` | 像素特效模块键：`heart`、`potion`、`xp`（对应心/瓶/经验球）。 |
| `label` | HUD 文案（如 `HP +18`）。 |
| `color` | 备用主题色。 |
| `heal` | `kind: heart` 时恢复的生命值。 |
| `mp` | `kind: potion` 时恢复的 MP 上限量（实际增加不超过当前缺口）。 |
| `xp` | `kind: xp` 时增加的经验值。 |

示例：把经验球改成 `xp: 12`、掉落率 `p: 0.35` 即可，无需改代码。

---

## 修改流程建议

1. 改 `stages.config.json` 调整波次、坐标或增删关卡。
2. 改 `enemies.config.json` 调整 **hp / attack / defense** 或新增 `type`（新 `critter` 须先在 `fx-registry.js` 注册模块）。
3. 改 `pickups.config.json` 调整掉落与回复/经验奖励。
3. 运行 `npm test`（含「波次 type 已注册」检查）。
4. `npm run build` 后刷新游戏。

---

## 当前内容快照

- **关卡数**：7（见 `stages` 数组长度）。
- **Boss 关**：第 3 关（熔岩深窟）、第 7 关（日灼圣殿）第 3 波为 `boss`。
- **小怪种类**：8 种 critter + 5 种 goblin + `boss`；各关具体组合以 `stages.config.json` 为准。

更细的部署说明见 [DEPLOY.md](./DEPLOY.md)。
