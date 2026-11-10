# Generative Cinematographer

Academic project page for **Generative Cinematographer: Composing Camera and Object Motion in 3D**.

**Website:** https://neuralcinema.github.io/

The page explains the method and includes interactive illustrations, authored 3D motion, generated results, and side-by-side video comparisons. All website assets are committed here and served directly by GitHub Pages. No S3 bucket, tunnel, login, external font service, or third-party video player is needed.

## Contents

- `site/`: deployable HTML, figures, PDFs, images, and MP4 videos.
- `src/page.html`: page content and styles.
- `src/app.js`: interactive figures, scene navigation, and synchronized video playback.
- `src/gallery-data.json`: the 16 examples with relative paths to the packaged media.
- `scripts/build.py`: dependency-free, deterministic HTML build and asset checks.
- `scripts/serve.mjs`: local preview server with MP4 byte-range support.
- `.github/workflows/pages.yml`: validates and deploys only `site/` on pushes to `main`.

The exported media are included, so building the website does not require the research environment or access to the original rendering jobs. Media files use ordinary Git blobs, not Git LFS.

## Edit and preview

Use Python 3.9 or later to build, and Node.js 18 or later to preview:

```sh
python3 scripts/build.py
python3 scripts/build.py --check
node scripts/serve.mjs
```

Open `http://localhost:8780`. Edit the files in `src/`, rebuild, and commit the source and updated `site/index.html`. To replace an asset, update the corresponding file under `site/` and its relative path in the source if necessary.

## Baseline comparisons

Section 04 displays Ours, LeviTor, I2V3D, Wan-Move, ATI, Go-with-the-Track, VerseCrafter, and SymphoMotion together. The scene selector, arrows, and dots switch all panels. Playback follows a shared normalized timeline, with independent pause and replay controls and full-size inspection.

LeviTor and I2V3D cover 15 of the 16 scenes; the robotic-arm scene explicitly marks those two results unavailable. The 30 added MP4 previews and their posters are packaged under `site/media/baselines/`. Videos retain the supplied preview streams, with metadata removed and MP4 headers moved to the front for streaming.

These qualitative previews cover each method's retained motion span in 3.5 seconds. They do not imply identical conditioning or exact frame correspondence. LeviTor uses independent windows without text conditioning; I2V3D runs without scene LoRA. The baseline-specific qualifications appear beside the videos.

## Publication and privacy

GitHub Actions deploys with its built-in short-lived credentials. No personal access token or repository secret is required by the workflow.

The page contains no visitor analytics, tracking pixels, cookies, local storage, telemetry, or remote embeds. Its Content Security Policy restricts assets to the same origin and blocks scripted network connections. The browser referrer policy is `no-referrer`.
