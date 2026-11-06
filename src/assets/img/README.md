# Website imagery

## Licensed anatomical animation

`motion/anatomical-heart.gif` is an archived, unused photogrammetry-based 3D beating-heart animation. The homepage now uses `heart-support.webp` with a subtle CSS heartbeat. It is **Animated Heart** by **DrJanaOfficial**, downloaded unchanged from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Animated_Heart.gif), licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Original: https://upload.wikimedia.org/wikipedia/commons/6/62/Animated_Heart.gif (800 × 800, 25 frames, 1-second loop). `motion/anatomical-heart.png` is the first frame extracted without visual changes for paused and reduced-motion playback, under the same license. These archived files are not loaded or displayed by the website; any future display must include creator and license links. This is a 3D illustration, not live patient footage or a diagnostic measurement.

## Generated imagery

These assets were generated for this design from descriptive prompts using OpenAI image generation:

- `heart-hero.webp`: anatomical heart hero illustration.
- `heart-hero-cutout.webp`: transparent-background edit of the heart, used on the homepage.
- `heart-support.webp`: generated sculptural heart for the homepage support explorer; built-in image generation tool, optimized to 640px WebP. Prompt recorded below.
- `motion/cardiac-pulse.gif`, `motion/clear-plan.gif`, `motion/connected-care.gif`: original programmatically drawn UI motion graphics in the red-and-navy brand palette, created with Pillow using `generate_home_motion.py`. Each is a 400x200, 40-frame loop with a matching PNG still. These graphics illustrate coordination and do not show clinical measurements.
- `cardiologist.webp`: fictional clinician in a hospital; does not depict a named clinician or affiliated provider.
- `angiography.webp`: decorative catheter illustration.
- `angioplasty.webp`: decorative balloon and stent illustration.
- `bypass-surgery.webp`: fictional surgical team; does not depict an affiliated team or facility.
- `heart-valve.webp`: decorative heart valve illustration.
- `cardiac-centre.webp`: fictional healthcare building used to illustrate the provider network; not a named partner facility.
- `care-coordination.webp`: fictional coordinator talking with a patient and family member, used in the conversation chapter on desktop and mobile. No affiliated team or real patient is depicted.
- `chapter-estimate.webp`: fictional consultation reviewing a written estimate.
- `chapter-decision.webp`: fictional family discussing their options at home.
- `chapter-handover.webp`: fictional coordinator handing a document folder to a patient.
- `heart-stethoscope.webp`: generated transparent still life of a heart symbol and stethoscope, used on Contact. Decorative, with no clinical or provider attribution.
- `procedure-tavi.webp`: decorative transcatheter valve illustration.
- `procedure-ablation.webp`: decorative catheter ablation illustration.
- `procedure-pacemaker.webp`: unbranded illustrative pacemaker and leads.
- `procedure-icd.webp`: unbranded illustrative defibrillator/resynchronization device and leads.
- `procedure-congenital.webp`: decorative septal closure illustration.
- `procedure-advanced.webp`: decorative aorta and vascular graft illustration.

Medical illustrations are presentation assets, not diagnostic or instructional images. They have not received clinical accuracy review. WebP versions are optimized for web delivery.

The current brand uses `fastcardiocare-logo.svg` and `fastcardiocare-logo-light.svg`: transparent vector lockups with an original heart-and-path symbol, outlined lettering, and navy/red or white/red palettes. `favicon.svg` uses the same symbol. The previous `fastcardiocare-logo-v1.png` is retained as an archived version. Vector source generation is recorded in `tmp/refine_logo.py`.

## Homepage support illustration prompt

Built-in image generation, 6 November 2026:

> Use case: stylized-concept. Asset type: square illustration for FastCardioCare cardiac care coordination homepage. Primary request: a premium three-dimensional ruby red anatomical-inspired human heart with smooth soft sculptural finish, elegant and reassuring, resting above a very pale cool blue-white background. A thin soft red ECG line crosses behind the heart, very subtle pale blue circular halo. Composition: one centered heart, generous empty margin, clean studio lighting with gentle shadow, modern professional healthcare brand, navy blue and crimson red accents. No text, no letters, no numbers, no logos, no gore, no watermark. This is a decorative illustration, not a medical diagram.
