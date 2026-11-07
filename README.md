# 余烬回响 · Ember Echo

一个用 **pixelfx** 的像素素材与特效模块搭起来的动作 RPG Demo：三幕关卡、六种技能、八种小怪、一个三阶段 Boss。所有画面都由代码实时绘制，没有贴图文件。

![标题画面](preview-title.png)

![战斗画面](preview.png)

```
WASD      移动（八向，纵向有轻微纵深）
J         星刃斩（三段连斩，无消耗）
K         烈焰术（火球，爆炸并灼烧）
L         霜环（身周冰环，冻结）
U         雷罚（落雷，眩晕；有落点预警）
I         圣愈（治疗 + 护盾）
O         陨星（三重陨石，大范围）
Esc       暂停 / 继续
M         静音
Enter     开始 / 重新开始
```

## 运行

需要 Node.js 18+。首次运行先打包一次（把 pixelfx 的模块打进单个 `game.js`）：

```bash
cd /Users/michiyang/Desktop/code/develop/game_dev/ember-echo
node build.mjs
node server.mjs
# 打开 http://127.0.0.1:8123/
```

`game.js` 已经随目录提供，所以也可以直接：

```bash
npm start           # 只起静态服务器
npm run dev         # esbuild --watch + 静态服务器
npm run build       # 重新打包
```

打包脚本会优先用本目录的 `node_modules/.bin/esbuild`，其次用同级 `../pixelfx/node_modules/.bin/esbuild`。

`game.js` 已经提交在仓库里，克隆后无需打包即可运行。只有改动 `src/` 后需要重新打包；从零构建时把
pixelfx 检出到同级目录并安装它的依赖：

```bash
git clone https://github.com/hanhandi-git/pixelfx-extended.git ../pixelfx
cd ../pixelfx && npm ci && cd -
node build.mjs
```

## 内容

- **三幕**：苔痕遗迹 → 幽火沼泽 → 熔岩深窟，逐幕解锁新的小怪，最后一幕有 Boss。
- **小怪**：苔泥、草蛇、沼蛙、夜蝠、鬼火、游魂、窥视者、焚颅。每种都有自己的像素循环、追击方式、攻击前摇与地面/连线预警。
- **Boss**：冥河守卫 · 阿刻戎。镰刀横扫、雷击落点、全屏雷环、召唤鬼火、三重陨石；66% / 33% 血量切换相位，并召唤增援。
- **成长**：击破获得经验，升级提升生命、法力与伤害；敌人掉落红心、法力药水、经验球，会自动吸附。
- **战斗手感**：三段连击、会心、受击白闪、击退、命中停顿、屏幕震动、技能冷却与法力门槛、连击计数。
- **界面**：顶部状态条 / 关卡信息 / Boss 条，底部独立技能栏（不遮挡 320×180 的战斗画面），伤害数字、拾取提示、阶段横幅。
- **声音**：WebAudio 现场合成，无音频文件；首次点击或按键后启动。

## 素材来源

游戏本身只做三件事：摆放、读时间、判定命中。画面来自同级 pixelfx 仓库的现成模块：

- 地图：`world/mossy-ruins`、`world/wisp-marsh`、`world/ember-depths`
- 怪物：`critters/slime`、`snake`、`frog`、`bat`、`wisp`、`ghost`、`eyeball`、`flying-skull`
- 技能：`melee/sword-slash`、`double-slash`、`heavy-cleave`、`fire/fireball`、`meteor`、`ice/frost-nova`、`lightning/lightning-strike`、`holy/heal-aoe`、`divine-shield`、`blessing`
- 反馈：`impacts/hit-spark`、`crit-hit`、`explosions/small-explosion`、`spawn/poof`、`spawn/shatter-death`、`spawn/spawn-portal`、`pickups/*`、`status/frozen`、`burning`、`stunned`、`ui/level-up`、`arcane/rune-circle`
- 角色：`src/core/characters.js` 的 `ember-duelist`（主角）与 `styx-warden`（Boss），由 `src/core/rig.js` 的骨骼/姿势系统绘制。

## 代码结构

```
index.html          320×180 战斗画面 + 独立技能栏 + 覆盖层
styles.css          像素风 UI、响应式 16:9 画面 + 底部命令条
game.js             由 build.mjs 生成的单文件产物（可直接部署）
build.mjs           esbuild 打包脚本
server.mjs          零依赖静态服务器
src/main.js         启动、键盘/触摸输入、主循环
src/game.js         世界、计时器、投射物、掉落、关卡流程、渲染
src/hero.js         主角属性、移动、骨骼动画、受伤/升级、头像
src/enemies.js      小怪 AI / Boss 三阶段 AI / 状态与血条
src/skills.js       六个技能的施法与命中判定
src/data.js         素材导入、敌人与关卡数据、技能元数据
src/ui.js           DOM HUD、冷却、横幅、覆盖层
src/audio.js        WebAudio 合成音效
```

## 设计说明

- 战斗区保持 320×180 原生像素，用 `image-rendering: pixelated` 放大；技能栏放在画面下方，不遮住角色和地面。
- 所有技能都是“先演后判”：火球有飞行时间，雷罚有 0.95s 落点预警，陨石有 1.15s 圈，Boss 大招有 0.7–1.3s 前摇。玩家可以靠走位躲开。
- 敌人攻击有地面圆环 / 目标连线提示；Boss 阶段切换会改变攻击池并召唤增援。
- 命中停顿、震屏、闪光和伤害数字都走同一套轻量系统；特效更新在命中停顿时一起冻结，保证打击感。

## 许可

本 Demo 的代码以 MIT 许可发布；其中打包的 pixelfx 素材、渲染器和特效代码同样为 MIT，详见
[LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。

## 已知边界

- 这是一个单机 Demo，没有存档、装备、技能树和联网。
- 移动端在触摸设备上会显示虚拟方向键/技能键，但主要按桌面键盘设计。
- 打包依赖同级 `pixelfx` 仓库；`game.js` 已是自包含产物，部署时只需 `index.html`、`styles.css`、`game.js`。
