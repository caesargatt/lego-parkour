# LEGO PARKOUR

Playable 3D parkour demo (Three.js). No build step. Three.js is vendored at `js/vendor/three.module.js`.

## Run locally

ES modules need a local HTTP server. Opening `index.html` with `file://` will not work.

```bash
python3 -m http.server 8080
```

Then open http://127.0.0.1:8080/

## Controls

- **WASD** — move
- **Space** — jump
- **B** — shop
- **Esc** — pause

**A** and **D** are screen-left and screen-right. That matches the third-person camera, which looks along **+Z** (screen-left is +X).
