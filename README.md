# LEGO PARKOUR

Playable 3D parkour demo (Three.js). No build step. Three.js is vendored at `js/vendor/three.module.js`.

## Run locally

ES modules need a local HTTP server. Opening `index.html` with `file://` will not work.

```bash
python3 -m http.server 8080
```

Then open http://127.0.0.1:8080/

To play on a phone, use that same server (or any static host) and open the page in the phone's browser. `127.0.0.1` is the computer itself, so on the same Wi-Fi use this machine's LAN address, for example `http://192.168.1.20:8080/`.

## Controls

- **WASD** / **arrows** — move
- **Space** — jump
- **B** — shop
- **Esc** — pause

**A** and **D** are screen-left and screen-right. That matches the third-person camera, which looks along **+Z** (screen-left is +X).

On a touch screen, or a narrow window, controls appear while you play: a stick on the left (move), **Jump** on the right, plus **Shop** and **Pause**. They drive the same movement and jump as the keyboard. Keyboard input still works.
