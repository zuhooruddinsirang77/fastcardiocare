"""Build the FastCardioCare static site.

Usage:
    python build.py                    # staging build (review flags visible, noindex)
    python build.py --env production   # production build (staging blocks removed, indexable)

Sources live in src/ (layout.html, pages/*.html, assets/). Output goes to site/.
Each page starts with a JSON meta comment:
    <!--meta {"title": "...", "description": "...", "nav": "home", "crumb": "Procedures"} -->
"""
import datetime
import json
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "site"
BASE_URL = "https://www.fastcardiocare.com"

NAV = [
    ("home", "index.html", "Home"),
    ("who", "who-we-are.html", "Who We Are"),
    ("procedures", "procedures.html", "Procedures"),
    ("how", "how-it-works.html", "How It Works"),
    ("packages", "packages.html", "Packages"),
    ("faqs", "faqs.html", "FAQs"),
]

STAGING_BLOCK = re.compile(r"<!--staging-->.*?<!--/staging-->", re.S)
META = re.compile(r"\s*<!--meta\s*(\{.*?\})\s*-->", re.S)


def env_from_args():
    if "--env" in sys.argv:
        i = sys.argv.index("--env")
        if i + 1 < len(sys.argv) and sys.argv[i + 1] == "production":
            return "production"
    return "staging"


def render_nav(active):
    lines = []
    for key, href, label in NAV:
        current = ' aria-current="page"' if key == active else ""
        if key == "who":
            why_current = ' aria-current="page"' if active == "why" else ""
            section_active = ' class="is-current"' if active in ("who", "why") else ""
            lines.append(
                f'          <li class="nav-group"><details class="nav-dropdown">'
                f'<summary{section_active}>Who We Are <svg class="i" aria-hidden="true"><use href="#i-chevron"/></svg></summary>'
                f'<ul><li><a href="who-we-are.html"{current}>Who We Are</a></li>'
                f'<li><a href="why-fastcardiocare.html"{why_current}>Why FastCardioCare</a></li></ul>'
                '</details></li>'
            )
            continue
        if key == "procedures":
            section_active = ' class="is-current"' if active == "procedures" else ""
            procedure_links = [
                ("procedures.html", "All Procedures"),
                ("procedures.html#angiography", "Coronary Angiography"),
                ("procedures.html#pci", "Angioplasty &amp; Stenting"),
                ("procedures.html#cabg", "Bypass Surgery"),
                ("procedures.html#valve", "Heart Valve Treatment"),
            ]
            links = ''.join(f'<li><a href="{url}"{current if url == href else ""}>{text}</a></li>' for url, text in procedure_links)
            lines.append(f'          <li class="nav-group"><details class="nav-dropdown"><summary{section_active}>Procedures <svg class="i" aria-hidden="true"><use href="#i-chevron"/></svg></summary><ul>{links}</ul></details></li>')
            continue
        lines.append(f'          <li><a href="{href}"{current}>{label}</a></li>')
    return "\n".join(lines)


def render_breadcrumb(crumb):
    if not crumb:
        return ""
    return (
        '      <nav class="breadcrumb" aria-label="Breadcrumb"><ol>'
        '<li><a href="index.html">Home</a></li>'
        f'<li><span aria-current="page">{crumb}</span></li></ol></nav>'
    )


def main():
    env = env_from_args()
    layout = (SRC / "layout.html").read_text(encoding="utf-8")
    year = str(datetime.date.today().year)

    # Clear the contents but keep the folder itself: on Windows the folder can be
    # locked by an open terminal, Explorer window or browser preview.
    OUT.mkdir(parents=True, exist_ok=True)
    for child in OUT.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()
    # Draft (unapproved) portraits are staging-only: never copied into a production build.
    ignore = shutil.ignore_patterns("*-draft.*") if env == "production" else None
    shutil.copytree(SRC / "assets", OUT / "assets", ignore=ignore)

    sitemap_urls = []
    tbc_total = 0
    for page in sorted((SRC / "pages").glob("*.html")):
        text = page.read_text(encoding="utf-8")
        m = META.match(text)
        if not m:
            sys.exit(f"Missing meta comment in {page.name}")
        meta = json.loads(m.group(1))
        body = text[m.end():].strip("\n")
        path = page.name
        canonical = f"{BASE_URL}/" if path == "index.html" else f"{BASE_URL}/{path}"
        noindex = env != "production" or meta.get("noindex")

        html = layout
        replacements = {
            "{{content}}": body.replace("{{breadcrumb}}", render_breadcrumb(meta.get("crumb"))),
            "{{nav}}": render_nav(meta.get("nav", "")),
            "{{title}}": meta["title"],
            "{{description}}": meta["description"],
            "{{canonical}}": canonical,
            "{{robots}}": "noindex, nofollow" if noindex else "index, follow",
            "{{env}}": env,
            "{{page}}": meta.get("nav") or page.stem,
            "{{year}}": year,
            "{{base}}": BASE_URL,
        }
        for key, val in replacements.items():
            html = html.replace(key, val)

        if env == "production":
            html = STAGING_BLOCK.sub("", html)
        else:
            html = html.replace("<!--staging-->", "").replace("<!--/staging-->", "")

        tbc = html.count('class="tbc"')
        tbc_total += tbc
        if env == "production" and tbc:
            print(f"  WARNING {path}: {tbc} unconfirmed item(s) still marked 'to be confirmed'")

        (OUT / path).write_text(html, encoding="utf-8")
        if not meta.get("noindex"):
            sitemap_urls.append(canonical)
        print(f"  built {path}")

    today = datetime.date.today().isoformat()
    urls = "\n".join(f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>" for u in sitemap_urls)
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>\n",
        encoding="utf-8",
    )
    robots = (
        f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}/sitemap.xml\n"
        if env == "production"
        else "# Staging: keep out of search engines\nUser-agent: *\nDisallow: /\n"
    )
    (OUT / "robots.txt").write_text(robots, encoding="utf-8")

    print(f"\nDone: {env} build in {OUT}")
    if tbc_total:
        print(f"{tbc_total} item(s) still marked 'to be confirmed' across the site.")


if __name__ == "__main__":
    main()
