# Remote static demo

The `main` branch deploys to <https://hanhandi.cn/ember_echo/>.

## Layout

- Compose project/service: `ember-echo` / `web`.
- Stable Compose file: `/home/ubuntu/code/ember-echo/compose.yaml`.
- Git archives: `/home/ubuntu/code/ember-echo/releases/<full-sha>/`.
- Image: `ember-echo:<full-sha>`.
- Loopback listener: `127.0.0.1:3012`.
- OpenResty route: `/opt/1panel/www/sites/hanhandi/proxy/ember_echo.conf`, sourced from `deploy/proxy.conf`.
- System Nginx forwards `/ember_echo/` to OpenResty at `127.0.0.1:18080` without stripping the prefix; OpenResty strips it before forwarding to port 3012.

## Release

Run `npm test`, commit and push to `origin/main`. Transfer only `git archive <full-sha>` to the release directory. Write deployment selectors in the stable directory's `.env`:

```dotenv
EMBER_ECHO_IMAGE_TAG=<full-sha>
EMBER_ECHO_BUILD_CONTEXT=/home/ubuntu/code/ember-echo/releases/<full-sha>
```

From the stable directory:

```sh
sudo docker compose config --quiet
sudo docker compose build web
sudo docker compose up -d --no-deps --wait --wait-timeout 90 web
```

After proxy or system-nginx edits, test and reload OpenResty (`docker exec 1Panel-openresty-H2DB nginx -t`) and system `nginx -t`. Verify the game loads, `game.js`/`styles.css`, and `healthz`, then:

```sh
cd /home/ubuntu/code
./compose-manager.py list
./compose-manager.py ps ember-echo web
```
