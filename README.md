# Axiom Global — Corporate Website

A static corporate advisory website built with pure HTML, CSS, and vanilla JavaScript. No frameworks, no build tools — just drop the files on any web host and it works.

---

## Project Structure

```
axiom-global/
├── index.html              # Main landing page
├── case-studies.html       # Case studies page
├── css/
│   └── style.css           # All styles (shared across both pages)
├── js/
│   └── script.js           # All JavaScript for index.html
├── assets/
│   ├── Gemini_Generated_Image_t7bomrt7bomrt7bo.png   # Logo
│   ├── ax1.jpg             # About section image
│   └── ax3.png             # Strategy section image
└── submit.php              # Form handler (server-side, optional)
```

---

## Pages

### `index.html` — Main Landing Page

| Section | Description |
|---|---|
| Header | Sticky nav with hamburger mobile menu and dark mode toggle |
| Hero | Full-bleed 3-slide carousel with animated headings and CTA |
| About | Two-column layout with image and company pillars |
| Quote 1 | Minimal centered quote strip |
| Expertise | 8-card service grid with watermark background |
| Strategy Session | Two-column image + text CTA section |
| Quote 2 | Bold dark card quote |
| Contact | 3-step multi-step form with progress bar |
| Footer | 4-column grid with links, services, and contact details |

### `case-studies.html` — Case Studies Page

| Section | Description |
|---|---|
| Header | Same sticky nav — "Case Studies" highlighted in accent colour |
| Page Hero | Title section with diagonal grid background |
| Filter Bar | Sticky category filter (All / Compliance / Finance / Operations / Legal / HR) |
| Case Studies Grid | 6 cards with stats, descriptions, and click-to-open modals |
| Modals | Full overlay per case study: challenge, approach, outcome |
| Footer | Identical to main page |

---

## Features

### Global
- **Dark / Light mode** — toggled via header button, persisted in `localStorage`
- **Custom cursor** — dot + lagging ring, expands on hover, hidden on touch devices
- **Scroll progress bar** — thin accent-coloured bar fixed at top of viewport
- **Back to top button** — appears after scrolling past the hero
- **Sticky floating CTA** — "Book Free Session" button, appears after hero (`index.html` only)
- **Page loader** — branded loading screen on initial page load (`index.html` only)
- **Smooth scroll** — native CSS `scroll-behavior: smooth`
- **Custom scrollbar** — styled via `::-webkit-scrollbar` and Firefox `scrollbar-color`

### index.html Specific
- **Hero carousel** — 3 slides, auto-play every 5s, arrow + dot controls, heading crossfade animation
- **Parallax scroll engine** — `requestAnimationFrame` loop driving hero exit, about entrance, expertise, strategy, and quote sections
- **Reveal on scroll** — `IntersectionObserver` for sections not handled by parallax
- **Multi-step form** — 3-step form with validation, progress bar, and custom alert modal
- **Card micro-animations** — staggered entrance via parallax engine

### case-studies.html Specific
- **Category filter** — instant show/hide with empty state handling
- **Modal overlays** — per-card full overlay with challenge / approach / outcome structure
- **Card entrance animations** — staggered `IntersectionObserver` fade-in

---

## CSS Architecture

All styles live in `css/style.css`. Both pages import this single file.

### CSS Variables (`:root`)

| Variable | Light | Dark |
|---|---|---|
| `--bg-primary` | `#ffffff` | `#12141c` |
| `--bg-secondary` | `#f4f7fb` | `#1e212e` |
| `--text-primary` | `#1a1f2e` | `#eef2f6` |
| `--text-secondary` | `#4a4f62` | `#b0b8c5` |
| `--accent` | `#0057b3` | `#4b9fff` |
| `--accent-hover` | `#003d80` | `#7fb9ff` |
| `--card-bg` | `#ffffff` | `#1f2332` |
| `--border` | `#e0e7ef` | `#2f3547` |
| `--footer-bg` | `#1a1f2e` | `#0c0e14` |

### Key Breakpoints

| Breakpoint | Changes |
|---|---|
| `max-width: 1260px` | Vertical line repositions to `left: 24px` |
| `max-width: 960px` | Footer collapses to 2-column grid |
| `max-width: 900px` | Hero bottom row goes single column |
| `max-width: 860px` | About and strategy sections stack vertically |
| `max-width: 800px` | Mobile nav activates, hero centres, hamburger appears |
| `max-width: 600px` | Footer single column, modal stats single column |

---

## JavaScript — `script.js` (index.html)

| Module | Description |
|---|---|
| Custom Cursor | `mousemove` + `requestAnimationFrame` ring lag |
| Theme Toggle | Reads/writes `localStorage` key `theme` |
| Mobile Menu | Hamburger + overlay open/close |
| Custom Alert Modal | Replaces browser `alert()` for form validation messages |
| Multi-step Form | `nextStep()` / `prevStep()` globals, per-step validation |
| Reveal Observer | `IntersectionObserver` for `.reveal` elements (excludes parallax-managed sections) |
| Parallax Engine | Single `rAF` loop — hero exit, about, quote 1, expertise, strategy, quote 2 |
| Scroll Progress | `scroll` event → `width` percentage on `#scrollProgress` |
| Page Loader | Hides `#pageLoader` 2s after `window.load` |
| Floating CTA + Back to Top | Appear after scrolling 80% of hero height |
| Card Micro Animations | `IntersectionObserver` toggling `.card-visible` |
| Hero Carousel | `goToSlide()`, auto-play interval, arrow + dot event listeners |

---

## Parallax Sections

The parallax engine in `script.js` manages these elements directly via inline styles (no CSS transitions — `rAF` controls all movement):

| Element | Effect |
|---|---|
| `.hero-content` | Slides up −80px + fades out on scroll (desktop only) |
| `.hero-slides` | Parallax at 35% scroll speed + fades (desktop only) |
| `.hero-overlay` | Opacity deepens on scroll |
| `.hero-vert-line` | Fades out early |
| `.hero-scroll-hint` | Fades out early |
| `.hero-carousel-controls` | Fades + `translateX(-50%) translateY()` |
| `.about-section` | Rises 60px on entrance |
| `.about-text` | Slides in from left |
| `.about-image-wrap` | Slides in from right |
| `.parallax-quote-1` | Rises on enter, slides up on exit |
| `.parallax-expertise` | Section + h2 + grid each animate independently |
| `.parallax-strategy` | Section + image (left) + text (right) animate independently |
| `.parallax-quote-2` | Rises on enter + card scale effect |

> **Note:** On mobile (`window.innerWidth ≤ 800`), hero content and slides parallax transforms are skipped to preserve CSS centering.

---

## Form Handling

The contact form in `index.html` posts to `submit.php`. A basic PHP handler is expected at that path. If no server-side handler is needed, replace the `action` attribute and handle submission entirely in JS.

Current JS intercepts `submit` for demo purposes:
```javascript
document.getElementById('multiStepForm').addEventListener('submit', function(e) {
    e.preventDefault();
    showAlert('Form submitted successfully! We will be in touch within 24 hours.');
});
```

---

## Adding a New Case Study

1. Add a new card in the `#csGrid` div in `case-studies.html`, following the existing card HTML pattern. Set `data-category` to one of: `compliance`, `finance`, `operations`, `legal`, `hr`. Set `data-id` to the next integer.

2. Add the corresponding entry to the `caseStudies` object in the `<script>` block:
```javascript
caseStudies[7] = {
    tag: 'Category Label',
    title: 'Case Study Title',
    client: 'Industry · Location',
    stats: [
        { value: 'X%', label: 'Metric Label' },
        { value: 'Y', label: 'Metric Label' },
        { value: 'Z', label: 'Metric Label' }
    ],
    challenge: `Paragraph one.\n\nParagraph two.`,
    approach: [
        'Step one description.',
        'Step two description.'
    ],
    outcome: `Single paragraph describing the result.`
};
```

---

## Deployment

This is a fully static site. Deploy by uploading all files to any web host maintaining the directory structure. No build step required.

For the contact form to send emails, `submit.php` must run on a PHP-capable server (e.g. cPanel hosting, DigitalOcean with Apache/Nginx + PHP).

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome / Edge | Full |
| Firefox | Full (custom scrollbar via `scrollbar-color`) |
| Safari | Full (`-webkit-backdrop-filter` included throughout) |
| Mobile browsers | Full (cursor hidden, parallax disabled on hero for mobile) |

---

## Fonts

[Poppins](https://fonts.google.com/specimen/Poppins) loaded from Google Fonts:
```
weights: 300 (light), 400 (regular), 600 (semibold), 700 (bold)
```

---

*Axiom Global · Strategic Clarity. Sustainable Growth.*
