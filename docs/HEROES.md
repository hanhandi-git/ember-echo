# 角色与职业

游戏继续使用项目原有 Canvas / pixelfx 渲染器。入口为 `src/main.js`，角色状态由 `Hero` 管理，技能施放统一经过 `castSkill()`，界面通过 `createSettingsUI()` 生成，存档沿用浏览器中的 `ember-echo-save`。

在营地整备或战斗背包的「人物」「技能」「造型」页选择剑士 / 法师。选择带职业的 DNF 造型也会切换到对应职业。剑士拥有三段连斩、裂空斩、破军突进、升龙斩、剑意守护、极刃觉醒和投掷；法师拥有无消耗的远程魔弹，以及火、冰、雷、治疗、陨石、魂爆。技能目录、装备、施放边界均按职业过滤，自动战斗和按住普攻也跟随当前职业。

`src/classes.js` 定义稳定职业 ID 和默认槽位；`src/data.js` 为全部技能赋予独占的 `classId`。`Hero.setClass()` 为两个职业分别保留造型和技能槽位，切换时取消前一职业尚未执行的攻击。旧的混合技能存档会保留当前职业可用的技能，其余槽位恢复该职业默认值；等级、余烬、强化和收藏沿用原有数据。

## DNF 像素素材

五套造型来自用户提供的本地 `dnf_art_refs/spriters_resource`，具体条目、帧号、源文件 SHA-256、手工脚底锚点和来源链接均在 `assets/heroes/manifest.json`：

- 剑神、帝血弑天、剑皇：`03_时装_二觉` 中的 A Type 武器合成帧。
- 元素师、元素爆破师：二觉目录没有法师，采用相邻 `01_角色职业_一觉` 中的 A Type 武器合成帧。

`python3 scripts/import-dnf-heroes.py` 可从原目录重新生成代码像素数据；可用 `--source /path/to/spriters_resource` 指定目录，需要 Pillow。该脚本生成原始合成帧的本地参考和代码归档。游戏当前使用 pixelfx 的 `src/core/dnf-pixel-data.js` 无武器身体层，可从 pixelfx 运行 `python3 tools/import-dnf-bodies.py` 重新生成。此步骤只裁除透明边缘、记录锚点和建立调色板索引，不缩放、不重绘、不改色，每次导入都逐帧比对裁切后 RGBA。五套共 201 个不同动作帧，覆盖待机、行走、三种攻击、施法、受击和倒地。

`src/hero-pixel-data.js` 保留原始合成帧的调色板索引和逐行动作像素归档。运行时使用 pixelfx 的无武器身体代码数据和共享的 `equipDnfFrame()`，不读取角色 PNG。`src/hero-sprites.js` 负责解码、镜像和逐像素绘制；`src/hero-wardrobe.js` 是装扮编辑入口：可以为全套动作设置色彩预设、覆盖某个调色板索引，或在指定帧添加 / 清除像素。战斗画布密度为 2，DNF 每个源像素对应一个实际画布像素；翻转保持完整像素格。原始序列没有 DNF 客户端的帧锚点，当前锚点人工对齐，动作按现有战斗时钟重新映射。身体帧中的固定武器已移除，当前装备的武器单独在动作握持点绘制。换武器会同时更新战斗身体、残影、人物卡和投掷覆盖；武器数值、判定和剑弧仍由游戏武器系统决定。程序化旧造型继续保留。

例如把某个职业换成冰蓝预设：

```js
hero.setAppearance({ preset: "frost" });
```

精确改一个颜色索引：

```js
HERO_PIXEL_EDITS["dnf-blade-master"].palette["14"] = "#5fdcff";
```

在某一帧增加发束像素或抹掉原像素：

```js
HERO_PIXEL_EDITS["dnf-blade-master"].frames[0] = {
  layers: [{ id: "new-hair", x: 0, y: 0, rows: ["..14..", "141414"] }],
};
```

原始 PNG 仍作为本地导入和版权溯源参考保留，但不参与浏览器运行；要做真正独立的头发 / 衣服动画层，需要继续为每个动作帧把像素移入对应 layer。转换器不会凭空恢复原图中被合成层遮挡的像素。

版权与来源：NEOPLE / NEXON，Spriters Resource。本地个人、非商业参考原型素材，不属于本项目 MIT 代码许可。详见用户素材库的 README；此任务不发布、不提交、不上传这些素材。

## 本地验证

```sh
npm run lint
npm test
npm run build
npm start
```

新增职业用例覆盖跨职业拒绝、双职业配置存取、旧存档迁移、魔弹远程命中与按住连发、延迟剑技伤害、切换职业取消延迟攻击和图集边界。浏览器检查覆盖人物、造型、技能过滤和实际画布。
