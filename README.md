<div align="center">
  <img src="icons/icon128.png" width="80" alt="Ebb icon" />
  <h1>Ebb</h1>
  <p>Your Claude usage quota, inline in the chat toolbar.<br/>No separate page. No popups. Just there.
  </p>
  <p><b>No external servers. No analytics. No Firebase. Everything stays in your browser.</b></p>

  <img src="https://img.shields.io/badge/manifest-v3-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/claude.ai-only-cc785c?style=flat-square" />
  <img src="https://img.shields.io/badge/data-local%20only-4a9e6f?style=flat-square" />
</div>

---

## What it looks like

![alt text](<resources/ebb - preview.png>)

Sits quietly between the attach button and the model selector. Color-coded:

| State | 5h usage | Color |
|-------|----------|-------|
| Calm | 0 – 69% | Muted grey |
| Warning | 70 – 89% | Amber |
| Danger | 90 – 100% | Red, pulsing |

---

## Install

1. **Clone or download this repo**

2. **Open Chrome extensions** `chrome://extensions`

3. **Enable Developer mode** — toggle in the top-right corner

4. **Load unpacked** → select the `ebb` folder

5. Open **claude.ai** — the bar appears automatically

> **Incognito?** Go to `chrome://extensions` → Ebb → Details → enable *Allow in Incognito*

---

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│                        claude.ai tab                        │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Chat input toolbar                     │   │
│   │  [+]  [5h ▬▬░ 25% · 7d ▬▬▬░ 36% · ↺ 3h 40m]  [↑] │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │ content.js injects bar       │
│                              │ & requests fresh data        │
└──────────────────────────────┼──────────────────────────────┘
                               │ chrome.runtime.sendMessage
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   background.js (service worker)            │
│                                                             │
│   1. Read cookie ──► lastActiveOrg  ──► your org UUID       │
│                                                             │
│   2. Fetch ────────► claude.ai/api/organizations/           │
│                       {orgId}/usage                         │
│                                                             │
│   3. Parse ────────► { five_hour: { utilization: 25.0 },   │
│                         seven_day: { utilization: 36.0 } }  │
│                                                             │
│   4. Store ────────► chrome.storage.local                   │
│                                                             │
│   5. Notify ───────► sendMessage(USAGE_UPDATED)             │
│                              │                              │
│   Repeats every 1 min  ◄─────┘                              │
│   via chrome.alarms                                         │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
              content.js receives USAGE_UPDATED
              and re-renders the bar in place
```

---

### Why this approach

Claude stores your organisation ID in a browser cookie called `lastActiveOrg`. The background worker reads that cookie, calls Claude's own usage endpoint with your existing session, and caches the result locally. No credentials are stored, no data leaves your browser.

---

## Files

```
ebb/
├── manifest.json     Chrome extension config — permissions, scripts
├── background.js     Service worker — reads cookie, fetches API, caches, notifies
├── content.js        Injected into claude.ai — builds and updates the bar
├── style.css         Montserrat font, progress bars, colour states
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── resources/
│   └── ebb - preview.png
└── README.md
```

## Why "Ebb"?

Usage ebbs away as you chat. When the 5-hour or 7-day window resets, the tide flows back in. The full cycle, usage draining and replenishing, mirrors the tidal rhythm of ebb and flow.

---

<div align="center">
  <sub>Built with zero dependencies. 3 files. Works.</sub>
</div>
