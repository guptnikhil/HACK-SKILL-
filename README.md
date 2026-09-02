# Guardian AI

# LOVABLE.md

## 1. PRODUCT CONTEXT

* **Product:** RescuAI

* **Primary User:** A panicked student or campus bystander facing an immediate minor medical or physical safety incident without medical expertise.

* **Problem:** Under acute stress, cognitive load spikes. Users freeze, panic, and waste critical seconds searching unstructured web pages or reading dense warning labels. Existing safety resources are static, lengthy, fragmented, and unreadable in a crisis.

* **Solution:** A single-screen, zero-friction emergency assistant that converts hazard photos or short text descriptions into 3 step-by-step first-aid directives, auto-translates warning safety notices, provides instant voice playback, and dispatches a GPS safety alert.

* **Desired Outcome:** Minimize time-to-first-action under 10 seconds from app load to visual display and audio playback of Step 1 action protocol.

---

## 2. DESIGN STRATEGY

* **Visual Metaphor:** Industrial safety HUD / Medical triage emergency console. High-contrast warning panels, strict grid alignment, explicit numeric callouts, and urgent status indicators.

* **Interface Personality:** Urgent, deterministic, calm under pressure, hyper-focused. No marketing fluff, no decorative elements, zero friction.

* **Information Density:** Extremely low on initial state (single high-impact input area); high clarity on active result state (large, readable 1-2-3 step cards).

* **Hierarchy:**

  1. Primary Hazard Alert / Status Bar (Top)

  2. Input / Drop Zone OR Active Step 1 Protocol (Center focus)

  3. Secondary Actions: Audio TTS playback toggle & Emergency SMS dispatch status (Bottom / Action Bar)

* **Whitespace Strategy:** Purposeful separation using high-contrast borders and deep dark background to eliminate eye strain and draw instant focus to action steps.

* **Visual Rhythm:** Monospaced structural metadata paired with ultra-bold sans-serif directives.

* **Interaction Personality:** Instant response, zero multi-step dialogs or popups, zero slide-out drawers. Direct inline state transitions.

---

## 3. VISUAL IDENTITY

### Typography

* **Primary (Headings & Action Steps):** `Inter`, `sans-serif` (Font weights: 700, 900 for ultra-bold legibility under stress)

* **Secondary (Metadata, Timestamps, Status Tags):** `JetBrains Mono`, `monospace` (For precise emergency dashboard feel)

### Color Strategy

* **Primary (Emergency Action / Alert):** `#EF4444` (Vibrant High-Visibility Red)

* **Secondary (Warning / Caution Accent):** `#F59E0B` (High-Conspicuity Amber)

* **Accent (Active System / Location):** `#10B981` (Emergency Signal Green)

* **Background:** `#09090B` (Deep Zinc / Pitch Black — maximum contrast)

* **Surface (Cards / Panels):** `#18181B` (Zinc-900 with sharp 1px border `#27272A`)

* **Text (Primary Directive):** `#FAFAFA` (Pure White)

* **Text (Secondary / Labels):** `#A1A1AA` (Muted Zinc)

* **Success:** `#10B981` (Emergency Green)

* **Warning:** `#F59E0B` (Amber Warning)

* **Error:** `#DC2626` (Red Alert)

### Why these colors fit:

This palette completely rejects generic AI SaaS aesthetics (no purple gradients, no soft blue shadows). It directly mirrors real-world emergency triage consoles, industrial danger notices, and high-visibility ambulance/fire safety gear. High-contrast red/amber/green indicators on deep black ensure immediate legibility under bright outdoor light or low-light lab conditions.

---

## 4. LAYOUT SYSTEM

* **Page Width:** Fixed max-width `640px` centered container (Mobile-first emergency view on all screens).

* **Grid:** Single column stack; strict vertical hierarchy.

* **Spacing:** Standard 4-point spatial scale (`p-4`, `p-6`, `gap-4`). No loose spacing.

* **Section Rhythm:** Fixed header bar $\rightarrow$ Primary Input / Output Triage Card $\rightarrow$ Direct Action Bar.

* **Navigation:** Non-existent. No menu bars, no hamburger icons, no footers with links. Pure single-purpose app.

* **Content Hierarchy:**

  * Top: Emergency Status Bar (GPS status, language selector)

  * Middle: Incident Capture OR 3-Step Protocol Directives

  * Bottom: Dispatch Alert Toast & TTS Audio Controls

* **Mobile Behavior:** Full-bleed 100vh layout; touch targets minimum `56px` height; immediate trigger of native mobile camera.

---

## 5. COMPONENT DESIGN

### 1. Header / Status Bar

* Monospaced live status (`GPS: ACTIVE [28.6139, 77.2090]`).

* High-contrast language selector dropdown (English / Hindi / Regional).

* No logo images or marketing text.

### 2. Input Interface (Initial State)

* Massive camera capture drop zone with a sharp red dashed border.

* Large action button: `[ SNAP HAZARD PHOTO ]` (Triggers native device camera).

* Alternative text input field: `"OR TYPE INCIDENT (e.g. Acid on hand, eye chemical splash)"`.

* Row of 3 rapid preset buttons for zero-typing: `[ CHEMICAL SPLASH ]`, `[ THERMAL BURN ]`, `[ DEEP CUT ]`.

### 3. Triage Result Interface (Active State)

* **Header Badge:** Severity indicator (`HIGH SEVERITY`, `MEDIUM SEVERITY`) in high-contrast badge.

* **Translated Warning Callout:** Large bold yellow banner displaying localized translated warning notice.

* **3 Action Protocol Cards:**

  * Huge number indicators (`01`, `02`, `03`) in monospaced red text.

  * Step Title in 20px Bold White text.

  * Direct action directive in clear, short, non-technical plain text.

### 4. Primary Action & Dispatch Bar

* Live toast alert box: `[ AUTO-DISPATCHING SMS ALERT TO CAMPUS SECURITY... ]` with green status light.

* Oversized Audio Control Button: `[ 🔊 READ OUT PROTOCOL (TTS) ]` for accessibility.

### 5. Error & Fallback Overlay

* If network fails or Gemini times out, immediately render static pre-cached protocol with a warning tag: `[ OFFLINE MODE - STANDARD FIRST-AID PROTOCOL ]`.

---

## 6. CORE USER JOURNEY

```text

[Screen 1: APP LOAD]

  ↓ (Zero click needed to view input; camera button centered)

[User Snaps Photo OR Taps Quick Preset "Chemical Splash"]

  ↓ (System sets status: "PARSING HAZARD VIA GEMINI...")

[Screen 2: TRIAGE RESULTS IN < 3 SECONDS]

  ↓

  ├── 1. Localized Warning Banner ("रसायन को त्वचा से तुरंत धोएं।")

  ├── 2. Step 1: FLUSH WITH WATER (Huge font, clear directive)

  ├── 3. Step 2: REMOVE CONTAMINATED CLOTHING

  ├── 4. Step 3: COVER LOOSELY WITH STERILE BANDAGE

  ↓ (Concurrent Background Execution)

[Auto-trigger Browser Audio Read-out of Step 1]

  +

[Auto-trigger Toast: "SMS alert dispatched to Campus Security with GPS location"].      







Now give LOVABLE.md + this prompt to Lovable











Read LOVABLE.md completely before making any changes.



LOVABLE.md is the source of truth.



Your task is to generate the frontend UI described in LOVABLE.md.



IMPORTANT:



Do not reinterpret the product.



Do not turn this into a generic AI SaaS application.



Do not add features that are not defined.



Do not invent dashboards.



Do not invent analytics.



Do not invent authentication.



Do not invent testimonials.



Do not invent statistics.



Do not add generic AI illustrations.



Do not use a standard purple-gradient AI aesthetic.



Follow the product-specific visual direction defined in LOVABLE.md.



PRIORITY ORDER:



1. Core user workflow

2. Usability

3. Information hierarchy

4. Distinctive visual identity

5. Responsive design

6. Accessibility

7. Loading/error/empty states

8. Visual polish



The frontend should feel like a real product designed specifically for the problem.



Backend integration should be represented through a clean integration boundary.



Do NOT put Gemini API credentials anywhere in the frontend.



Do NOT directly call Gemini from browser-side code.



The frontend will communicate with Supabase Edge Functions.



Build the UI now.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1b89902f-0c4c-491f-a6da-ccb01c9adea7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
