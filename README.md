# FastCardioCare website

A static HTML/CSS/JS build of fastcardiocare.com, based on the developer handoff (v1.0, 3 November 2026) and the visual mockup.

## Preview

Open `site/index.html` in a browser. For a local server:

```
cd site
python -m http.server 8080
```

Then go to http://localhost:8080.

## Structure

```
src/
  layout.html          Shared <head>, header, navigation, footer, icon sprite
  pages/*.html         Page content. Each file starts with a JSON meta comment
  assets/css/styles.css
  assets/css/services.css  Procedures, journey, estimates, FAQs and contact layouts
  assets/css/services-reference.css  Latest page-reference refinements
  assets/css/chrome.css    Shared header, responsive navigation and illustrated footer
  assets/css/procedures.css  Editorial procedure directory and illustrated rows
  assets/css/home-motion.css  Homepage entrances, reveals and decorative animation
  assets/js/main.js    Mobile menu, procedure deep links, form validation, tracking stub
  assets/js/services.js    Procedure filters, local FAQ search and preview-form messaging
  assets/js/home-motion.js  Homepage motion controls, visibility and reduced-motion support
  assets/css/home-live.css  Homepage scroll reveals and interactive states (loaded last)
  assets/js/home-live.js    Homepage reveals, hero links, journey progress, filter pill, destination panels
  assets/img/          Generated WebP imagery, decorative SVGs and favicon
build.py               Builds src/ into site/
site/                  Generated output. Deploy this folder; don't edit it by hand
```

## Build

```
python build.py                   # staging: review flags shown, noindex, robots blocks all
python build.py --env production  # removes <!--staging--> blocks, indexable, sitemap in robots.txt
```

The production build prints a warning for every page that still contains a `To be confirmed` placeholder.

The homepage follows the supplied red-and-navy visual reference, with generated heart, clinician and procedure imagery. `src/assets/css/reference.css` supplies the visual layer and responsive layouts after the shared stylesheet. The clinician and surgical team are fictional illustrations, not representations of affiliated providers. Generated medical imagery is decorative and needs clinical review before launch. Image details are in `src/assets/img/README.md`.

The Who We Are and Why FastCardioCare pages follow their supplied references using `src/assets/css/about.css`. Both are available through the Who We Are navigation dropdown. Provider imagery is illustrative; unverified clinician information stays in the staging-only verification panel. Company details retain their confirmation placeholders.

Procedures, How It Works, Packages, FAQs and Contact share the same visual theme through `services.css`, with the latest reference refinements in `services-reference.css`. Procedure categories and FAQ search run entirely in the browser and also work when opening `site/*.html` directly. The journey has a numbered timeline; estimates use compact inclusion cards; FAQs have a clinician hero and category sidebar; Contact places its introduction beside the form and uses a generated heart-and-stethoscope image. Optional form preferences expand on demand. The form displays a preview notice and an honest preview completion message until a submission endpoint is configured.

`chrome.css` applies the final header/footer reference to every page, including the utility notice, both navigation dropdowns, active-page indicators, emergency panel and native SVG waves. The menu collapses on narrower screens and supports keyboard dismissal.

The Procedures page uses a compact editorial directory with a topic sidebar and an illustration for each of its ten guides. Additional TAVI, ablation, pacemaker, ICD/CRT, congenital and aortic illustrations replace the original icon-only panels. Generated imagery remains decorative and subject to clinical review.

Homepage motion uses lightweight CSS and JavaScript: staged hero entrances, a subtle double-contraction heartbeat with a resting phase, synchronized ECG highlights, one-time scroll reveals and hover responses. Hero cards gently float over a breathing glow; fine pointers add up to five pixels of artwork movement while copy stays fixed. The journey cue, reassurance icons and link arrows add small motion accents. These additions follow the Pause motion control and reduced-motion preference; continuous hero effects pause off screen and in hidden tabs. The first care-journey scene uses the polished red 3D heart-support illustration with a restrained CSS heartbeat. The Pause motion control and device reduced-motion preference disable this effect. The earlier anatomical GIF and original motion assets remain archived and are not loaded by the homepage. The removed support explorer no longer appears on the homepage. Procedure filters let visitors browse diagnostic tests, artery procedures or valve treatment. The Pause motion button remembers a browser-local preference. GIFs switch to matching PNG stills when paused, off screen, in an inactive scene, in a hidden tab or under device reduced-motion settings. `home-interactive.css` and `home-interactive.js` provide the journey refinements, filters and GIF playback control. The original motion assets remain available in `src/assets/img/motion/`.

The homepage chapter section retains its seven-scene design and clickable ECG progress controls on desktop. The journey uses a more compact reading layout, larger navigation targets and restrained shadows. On phones and tablets it becomes a full-width swipeable card deck with progress controls, readable text and a height matched to the active chapter. `story-mobile.css` supplies that presentation. Conversation, estimate, decision and records chapters use the same editorial photographs on desktop and mobile. These are illustrative fictional scenes, not actual patients or affiliated staff. Without JavaScript, chapters remain readable inline. The homepage motion preference also applies to chapter effects.

`home-live.css` and `home-live.js` add the homepage's live layer. Headings rise word by word and sections, cards and photographs reveal as they scroll into view. In the hero, dotted links carry a pulse from the heart to the three cards, the cards respond to hover, the heart answers a click or tap with a stronger beat, and a soft light follows the pointer. The care journey has a red progress line that fills with the scroll, direction-aware step transitions, swipe on touch screens and a travelling ECG on step 1. Procedure filters use a sliding pill and animate their results; cards tilt towards the pointer. The three destination photographs open on hover or tap and take turns while on screen. The closing band draws its ECG and lights under the pointer. Everything follows the Pause motion control and the device reduced-motion preference, and all content stays visible without JavaScript. `story.js` only runs when a `[data-story]` section exists, which the current homepage does not have.

`directory-live.css` and `directory-live.js` add the same kind of live layer to the hospital network and medical coordinator pages: a staged hero entrance with a drifting photograph, beating heart outline and pointer light; word-by-word section headings; pointer light and hover depth on hospital, coordinator and guidance cards; a ring when a hospital is saved; a sliding indicator under the coordinator role tabs; filter and Show more results that animate in; and animated dialogs. `network.js` still owns filtering, dialogs and saved hospitals. The layer respects the device reduced-motion preference.

## Pages

The Our Network menu includes a six-hospital cardiac directory for Pakistan, Thailand and Malaysia (`accredited-network.html`, also available at `hospitals.html`) with linked service and accreditation sources, plus `medical-coordinators.html` with 30 explicitly fictional sample profiles. Both directories have country buttons, text search and a clear-filter control. Hospital cards open an accessible details dialog; comparison controls have been removed. The heart control saves hospital names in browser-local storage. Coordinator browsing includes role filters, eight profiles at a time with a Show more button, and sample profile dialogs describing nonclinical support. All 30 profiles remain readable without JavaScript. Dialogs support Escape and restore focus to the opening control. The premium medical presentation uses navy-and-white split heroes, large illustrative photographs, generous spacing, larger profile portraits and readable card typography. Hospital accreditation details expand on demand. Consistent directory navigation, mobile layouts and short entrance transitions respect reduced-motion settings. The generated 30-portrait atlas and final built-in image generation prompt are in `src/assets/img/coordinator-portraits.png` and `coordinator-portraits-prompt.md`. Hospital and medical coordinator joining links preselect the relevant contact role and reveal organization, destination and accreditation/experience fields. The existing contact endpoint remains unconfigured: these enquiries run in preview mode until a backend is connected. No listed hospital is claimed as an approved FastCardioCare partner.

Home, Who We Are, Why FastCardioCare, Procedures, How It Works, Packages, FAQs, Contact, plus Privacy Notice, Terms, Medical Disclaimer, Accessibility and a 404 page.

## Must be resolved before launch

All placeholders are marked with the yellow `.tbc` style. The `<!--staging-->` blocks are removed automatically in production.

- [ ] Company facts: US legal name, state of formation, mailing address, email, phone, hours, any response-time commitment
- [ ] Dr. Naseer profile: written approval, name/title, qualifications, registrations, current role, affiliations, approved biography and photo release. A template is in an HTML comment in `src/pages/who-we-are.html`
- [ ] Cardiologist review of all procedure copy (every card has `data-review="pending-cardiologist-review"`). Confirm team and facility before listing the complex aortic / advanced heart-failure pathway
- [ ] Coordination fee and provider relationship disclosure (Packages page)
- [ ] Counsel review: Privacy Notice, Terms, Medical Disclaimer, consent wording, cross-border data handling
- [ ] Provider or JCI badges: only for a named facility, linked to the current JCI directory record
- [ ] Licensed images with releases, if any are added. Never imply a pictured clinician will treat the visitor
- [ ] A 1200×630 Open Graph image (see the TODO in `layout.html`)
- [ ] Self-host the Inter font, or accept Google Fonts in the privacy review

## Enquiry form backend

The form runs in demo mode: it validates in the browser and shows the success message, but sends nothing. To connect it:

1. Set `data-endpoint="/your/handler"` on `<form id="enquiry-form">` in `src/pages/contact.html`. The form POSTs `FormData`. A 2xx response shows the success message; anything else shows an error.
2. On the server, repeat all validation, reject submissions where the `website` honeypot is filled, and add a CAPTCHA or rate limiting.
3. Deliver to an access-controlled inbox or CRM with retention limits. Don't put message contents in notification emails or general CRM notes.
4. No file upload exists on this form, and none should be added. A secure records route needs its own privacy and security approval.

## Analytics

`window.fccTrack(name)` pushes event names only (for example `cta_consultation_header`, `form_complete`) to `dataLayer`, if one exists. Never add form values, message text or the area-of-interest choice to events, URLs or advertising pixels. Add a consent banner if any non-essential cookies are introduced.

## CMS handover

This static build is the approved design and content reference. To give the owner self-service editing (procedures, FAQs, bios, contact details) with approval for medical copy, port `layout.html` and the page sections to the chosen CMS as templates. Each procedure card and FAQ item is a self-contained, repeatable block.

The hospital directory now follows the supplied reference with a compact curved hero, red-and-navy navigation tabs, official hospital imagery, horizontal service cards, details dialogs, comparison controls, a four-part guidance section and a consultation banner. `network-reference.css` is scoped to `.reference-network` and loads after the shared directory brand styles, so the coordinator page retains its presentation. Hospital image provenance is recorded in `src/assets/img/hospitals/sources.json`.

The latest supplied references are implemented in `directory-reference.css`: hospital photo overlays, location chips, expandable source details and a single details action; a navy coordinator hero, synchronized role tabs and filters, four-column desktop profile cards, eight-profile pagination and a coordinated support banner. No ratings, clinical credentials or hospital endorsements are invented. All coordinator profiles remain fictional samples.

The hospital directory destination tabs and search controls are removed from the rendered page (`data-filters="off"`), while coordinator filters remain available. The latest hospital cards use a red photo-edge wave, city/country metadata beneath the image and compact pink service chips. Comparison remains removed.
