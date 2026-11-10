#!/usr/bin/env python3
"""Build and validate the static project page with Python's standard library."""
import argparse
import base64
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
SRC = ROOT / "src"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def local_asset(value):
    url = urlsplit(value)
    require(not url.scheme and not url.netloc, f"External asset: {value}")
    if not url.path:
        return
    require(not url.path.startswith("/"), f"Use relative asset paths: {value}")
    asset = (SITE / unquote(url.path)).resolve()
    require(asset.is_relative_to(SITE.resolve()), f"Asset leaves site: {value}")
    require(asset.is_file(), f"Missing asset: {value}")


class PageAssets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.nav_paper = []
        self.meta = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            self.meta[attrs.get("name", attrs.get("http-equiv"))] = attrs.get("content")
        if "nav-paper" in attrs.get("class", "").split():
            self.nav_paper.append((tag, attrs))
        for key in ("href", "src", "poster", "data-image"):
            if attrs.get(key):
                self.refs.append(attrs[key])


def data_assets(value):
    if isinstance(value, dict):
        for key, item in value.items():
            if key in {"inputData", "annotationData", "videoData", "posterData"}:
                require(isinstance(item, str), f"Expected an asset path for {key}")
                yield item
            else:
                yield from data_assets(item)
    elif isinstance(value, list):
        for item in value:
            yield from data_assets(item)


def render():
    data = json.loads((SRC / "gallery-data.json").read_text())
    template = (SRC / "page.html").read_text()
    script = (SRC / "app.js").read_text()
    for marker in ("__DATA__", "__JS__", "__CSP__"):
        require(template.count(marker) == 1, f"Expected one {marker} placeholder")
    page = template.replace(
        "__DATA__", json.dumps(data, separators=(",", ":")).replace("<", "\\u003c")
    ).replace("__JS__", script)
    for name in ("framework", "correspondence"):
        digest = hashlib.sha256((SITE / "assets" / f"{name}.pdf").read_bytes()).hexdigest()
        page = page.replace(
            f'href="assets/{name}.pdf"', f'href="assets/{name}.pdf?v={digest[:12]}"'
        )
    scripts = re.findall(r"<script>(.*?)</script>", page, re.S)
    require(len(scripts) == 1, "Review the privacy policy before adding a script")
    digest = base64.b64encode(hashlib.sha256(scripts[0].encode()).digest()).decode()
    policy = (
        f"default-src 'none'; script-src 'sha256-{digest}'; "
        "style-src 'self' 'unsafe-inline'; img-src 'self'; media-src 'self'; "
        "font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; "
        "worker-src 'none'; base-uri 'none'; form-action 'none'"
    )
    page = page.replace("__CSP__", html.escape(policy, quote=True))
    require(not re.search(r"__(?:META|DATA|METRICS|JS|CSP)__", page), "Unfilled template")
    require(not re.search(r"https?://|s3://|/Users/|/home/|gh[pousr]_", page),
            "Page contains an external URL, private path, or credential prefix")
    parsed = PageAssets()
    parsed.feed(page)
    require(parsed.meta.get("referrer") == "no-referrer", "Referrer policy missing")
    require(parsed.meta.get("Content-Security-Policy") == policy, "CSP mismatch")
    require(len(parsed.nav_paper) == 1, "Expected one header Paper button")
    tag, attrs = parsed.nav_paper[0]
    require(tag == "button" and "disabled" in attrs and "href" not in attrs,
            "Header Paper button must remain unlinked")
    refs = set(parsed.refs) | set(data_assets(data))
    for value in refs:
        local_asset(value)
    files = [p for p in SITE.rglob("*") if p.is_file()]
    for path in files:
        require(not path.is_symlink(), f"Unexpected symlink: {path.relative_to(ROOT)}")
        require(path.stat().st_size < 100 * 1024 * 1024,
                f"File exceeds GitHub's regular-file limit: {path.relative_to(ROOT)}")
    return page, {"cases": len(data["cases"]), "asset_references": len(refs),
                  "site_files": len(files), "site_bytes": sum(p.stat().st_size for p in files)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check the committed HTML without changing it")
    args = parser.parse_args()
    page, summary = render()
    output = SITE / "index.html"
    if args.check:
        require(output.read_text() == page, "site/index.html is stale; run python3 scripts/build.py")
    else:
        output.write_text(page)
    print(json.dumps({"status": "passed", "mode": "check" if args.check else "build", **summary}))


if __name__ == "__main__":
    main()
