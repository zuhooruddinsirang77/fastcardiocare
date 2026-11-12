"""Build the FastCardioCare static site.

Usage:
    python build.py                    # staging build (review flags visible, noindex)
    python build.py --env production   # production build (staging blocks removed, indexable)

Sources live in src/ (layout.html, pages/*.html, assets/). Output goes to site/.
Each page starts with a JSON meta comment:
    <!--meta {"title": "...", "description": "...", "nav": "home", "crumb": "Procedures"} -->
"""
import datetime
import html as htmllib
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
    ("procedures", "procedures.html", "Procedures"),
    ("how", "how-it-works.html", "How It Works"),
    ("network", "accredited-network.html", "Our Network"),
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


ORG_ID = f"{BASE_URL}/#organization"
SITE_ID = f"{BASE_URL}/#website"
ROBOTS_INDEX = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"

# Page-level schema.org type. Anything not listed is a plain WebPage.
PAGE_TYPES = {
    "faqs.html": "FAQPage",
    "contact.html": "ContactPage",
    "who-we-are.html": "AboutPage",
    "why-fastcardiocare.html": "AboutPage",
    "procedures.html": "CollectionPage",
    "hospitals.html": "CollectionPage",
    "accredited-network.html": "CollectionPage",
    "medical-coordinators.html": "CollectionPage",
    "packages.html": "CollectionPage",
}


def plain(fragment):
    """Visible text of an HTML fragment (tags stripped, entities decoded, whitespace collapsed)."""
    text = re.sub(r"<(script|style|template)\b.*?</\1>", " ", fragment, flags=re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", htmllib.unescape(text)).strip()


def extract_faqs(body):
    """Question/answer pairs exactly as they appear on the page, so the markup matches visible content."""
    pairs = []
    for m in re.finditer(r'<details class="faq"[^>]*>\s*<summary>(.*?)</summary>\s*<div class="faq__body">(.*?)</div>\s*</details>', body, re.S):
        pairs.append((plain(m.group(1)), plain(m.group(2))))
    for m in re.finditer(r'<details(?: name="[^"]*")?>\s*<summary>(.*?)</summary>\s*<p>(.*?)</p>\s*</details>', body, re.S):
        question = re.sub(r'<span[^>]*aria-hidden="true"[^>]*>.*?</span>', " ", m.group(1), flags=re.S)
        pairs.append((plain(question), plain(m.group(2))))
    return [(q, a) for q, a in pairs if q and a]


def extract_procedures(body, url):
    items = []
    pattern = r'<details class="proc" id="([^"]+)".*?<span class="proc__title">(.*?)</span>\s*(?:</span>)?.*?<span class="proc__summary">(.*?)</span>'
    for m in re.finditer(pattern, body, re.S):
        slug, title, summary = m.groups()
        items.append({"@type": "MedicalProcedure", "name": plain(title), "description": plain(summary), "url": f"{url}#{slug}"})
    return items


def build_jsonld(path, meta, body, canonical):
    org = {
        "@type": "Organization",
        "@id": ORG_ID,
        "name": "FastCardioCare",
        "url": f"{BASE_URL}/",
        "logo": {"@type": "ImageObject", "url": f"{BASE_URL}/assets/img/fastcardiocare-logo.svg"},
        "description": "Patient coordination and travel-related support for planned cardiac care. FastCardioCare is not a healthcare provider.",
        "areaServed": [{"@type": "Country", "name": c} for c in ("Pakistan", "Thailand", "Malaysia")],
        "knowsAbout": ["Cardiac care coordination", "Coronary angiography", "Angioplasty and stenting", "Coronary artery bypass surgery", "Heart valve treatment", "Medical travel planning"],
    }
    site = {
        "@type": "WebSite",
        "@id": SITE_ID,
        "url": f"{BASE_URL}/",
        "name": "FastCardioCare",
        "inLanguage": "en",
        "publisher": {"@id": ORG_ID},
    }
    page = {
        "@type": PAGE_TYPES.get(path, "WebPage"),
        "@id": f"{canonical}#webpage",
        "url": canonical,
        "name": meta["title"],
        "description": meta["description"],
        "inLanguage": "en",
        "isPartOf": {"@id": SITE_ID},
        "about": {"@id": ORG_ID},
        "primaryImageOfPage": {"@type": "ImageObject", "url": f"{BASE_URL}/assets/img/cardiac-centre.webp"},
    }
    graph = [org, site, page]
    if path != "index.html" and meta.get("crumb"):
        page["breadcrumb"] = {"@id": f"{canonical}#breadcrumb"}
        graph.append({
            "@type": "BreadcrumbList",
            "@id": f"{canonical}#breadcrumb",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE_URL}/"},
                {"@type": "ListItem", "position": 2, "name": plain(meta["crumb"]), "item": canonical},
            ],
        })
    faqs = extract_faqs(body)
    if faqs:
        questions = [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]
        if page["@type"] == "FAQPage":
            page["mainEntity"] = questions
        else:
            graph.append({"@type": "FAQPage", "@id": f"{canonical}#faq", "url": canonical, "mainEntity": questions})
            page["mainEntity"] = {"@id": f"{canonical}#faq"}
    if path == "procedures.html":
        procs = extract_procedures(body, canonical)
        if procs:
            page["mainEntity"] = {
                "@type": "ItemList",
                "name": "Cardiac procedures explained",
                "numberOfItems": len(procs),
                "itemListElement": [{"@type": "ListItem", "position": i, "item": item} for i, item in enumerate(procs, 1)],
            }
    data = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=2).replace("</", "<\\/")
    return f'<script type="application/ld+json">\n{data}\n  </script>'


def build_llms_txt(pages):
    lines = [
        "# FastCardioCare",
        "",
        "> FastCardioCare is a patient coordination service for planned cardiac care. It helps patients and families communicate with independent licensed providers in Pakistan, Thailand and Malaysia and organise practical, travel-related support. FastCardioCare is not a healthcare provider, does not diagnose or treat conditions, and cannot guarantee clinical outcomes, eligibility, timing or prices. Estimates are case-specific and confirmed in writing by the treating provider. This website is not for emergencies.",
        "",
        "## Pages",
        "",
    ]
    for path, meta in pages:
        name = plain(meta["title"]).split(" | ")[0]
        lines.append(f"- [{name}]({BASE_URL}/{'' if path == 'index.html' else path}): {meta['description']}")
    lines.append("")
    return "\n".join(lines)


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
        if key == "network":
            section_active = ' class="is-current"' if active in ("network", "hospitals", "coordinators") else ""
            network_links = [("network", "accredited-network.html", "Our Network"), ("hospitals", "hospitals.html", "Cardiac Hospitals"), ("coordinators", "medical-coordinators.html", "Medical Coordinators")]
            links = ''.join(f'<li><a href="{url}"' + (' aria-current="page"' if active == item else '') + f'>{text}</a></li>' for item, url, text in network_links)
            lines.append(f'<li class="nav-group"><details class="nav-dropdown"><summary{section_active}>Our Network <svg class="i" aria-hidden="true"><use href="#i-chevron"/></svg></summary><ul>{links}</ul></details></li>')
            continue
        if key == "procedures":
            section_active = ' class="is-current"' if active == "procedures" else ""
            procedure_links = [
                ("procedures.html", "All Procedures"),
                ("procedures.html#angiography", "Coronary Angiography"),
                ("procedures.html#pci", "Angioplasty &amp; Stenting"),
                ("procedures.html#cabg", "Bypass Surgery"),
                ("procedures.html#valve", "Heart Valve Treatment"),
                ("procedures.html#tavi", "TAVR / TAVI"),
                ("procedures.html#ablation", "Catheter Ablation"),
                ("procedures.html#pacemaker", "Pacemaker Implantation"),
                ("procedures.html#icd-crt", "ICD / CRT Devices"),
                ("procedures.html#congenital", "Congenital Heart Repair"),
                ("procedures.html#advanced", "Advanced Heart-Failure Care"),
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


def render_crumb_bar(crumb):
    if not crumb:
        return ""
    return f'<div class="crumb-bar"><div class="container">{render_breadcrumb(crumb).strip()}</div></div>\n'


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
    llms_pages = []
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
            # The breadcrumb always sits in its own bar directly under the header, so it is in the same place on every page.
            "{{content}}": render_crumb_bar(meta.get("crumb")) + body.replace("{{breadcrumb}}", ""),
            "{{nav}}": render_nav(meta.get("nav", "")),
            "{{title}}": meta["title"],
            "{{description}}": meta["description"],
            "{{canonical}}": canonical,
            "{{robots}}": "noindex, nofollow" if noindex else "index, follow",
            "{{jsonld}}": "" if meta.get("noindex") else build_jsonld(path, meta, body, canonical),
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
            llms_pages.append((path, meta))
        print(f"  built {path}")

    today = datetime.date.today().isoformat()
    urls = "\n".join(f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>" for u in sitemap_urls)
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>\n",
        encoding="utf-8",
    )
    ai_bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot", "Googlebot"]
    robots = (
        "User-agent: *\nAllow: /\n\n"
        + "".join(f"User-agent: {bot}\nAllow: /\n\n" for bot in ai_bots)
        + f"Sitemap: {BASE_URL}/sitemap.xml\n"
        if env == "production"
        else "# Staging: keep out of search engines\nUser-agent: *\nDisallow: /\n"
    )
    (OUT / "robots.txt").write_text(robots, encoding="utf-8")
    (OUT / "llms.txt").write_text(build_llms_txt(llms_pages), encoding="utf-8")

    print(f"\nDone: {env} build in {OUT}")
    if tbc_total:
        print(f"{tbc_total} item(s) still marked 'to be confirmed' across the site.")


if __name__ == "__main__":
    main()
