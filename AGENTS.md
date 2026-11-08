# Agent 约定

本项目的修改完成后，默认使用个人 skill `commit-push-deploy`，按 `.codex/deploy.json` 自动验证、commit、push、部署并执行线上验收。用户明确要求跳过时遵从当次指令。

## 默认生产环境

- **SSH**：`ubuntu@42.192.38.33`（凭证由操作者本地保管，**不要**写入本仓库或 `.codex/deploy.json`）
- **编排根目录**：`/home/ubuntu/code`（`./compose-manager.py list` 查看全部 Compose 项目）
- **本项目**：Compose 项目 `ember-echo`，服务 `web`，稳定配置 `/home/ubuntu/code/ember-echo/compose.yaml`
- **发布目录**：`/home/ubuntu/code/ember-echo/releases/<full-git-sha>/`
- **对外入口**：<https://hanhandi.cn/ember_echo/>（OpenResty 剥前缀后反代 `127.0.0.1:3012`）

新服务的一般流程：在 `/home/ubuntu/code/<slug>/` 放置 `compose.yaml`，绑定本机 loopback 端口，在 1Panel/OpenResty 与系统 Nginx 增加路径代理，再用 `compose-manager.py` 验收。

详细步骤见 `docs/DEPLOY.md`。
