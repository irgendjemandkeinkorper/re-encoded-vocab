# Mobile UX Manual Test Matrix

This document outlines the testing parameters, environments, and findings for the mobile UX optimization of the Re-Encoded Vocabulary application.

## Tested Device Viewports & Orientations

Each target width was evaluated in both **Portrait** and **Landscape** orientations:

| Viewport Width | Typical Devices | Portrait Tested | Landscape Tested |
| :--- | :--- | :---: | :---: |
| **320px** | iPhone SE (1st Gen), Jelly 2 | ✅ Pass | ✅ Pass |
| **375px** | iPhone X / XS / 11 Pro, SE (2nd/3rd Gen) | ✅ Pass | ✅ Pass |
| **390px** | iPhone 12 / 13 / 14 / 15 | ✅ Pass | ✅ Pass |
| **430px** | iPhone 14 / 15 / 16 Pro Max | ✅ Pass | ✅ Pass |

---

## Core Learning Flows & Interaction Checklist

The following matrix documents the verification results of key features and learning flows:

| Category | Flow / Target | Requirement | Status | Verification Findings |
| :--- | :--- | :--- | :---: | :--- |
| **Global** | Page Layout | No unintended horizontal scrolling (`overflow-x`). | **✅ PASS** | No layout breakages, elements strictly fit 100% viewport width. |
| **Global** | Safe Areas | Account for notch/sensor housing & home indicator. | **✅ PASS** | Leverages `viewport-fit=cover` and dynamic padding with `env(safe-area-inset-...)`. |
| **Interactive** | Tap Targets | Primary interactive elements $\ge$ 44x44px or have equivalent touch margins. | **✅ PASS** | `.tab`, `.lens-chip`, `.mode-btn`, `.icon-btn`, and `.star-btn` are all adjusted to >= 44px height or area. |
| **Navigation** | Subject/Category Tabs | Prevent control wrapping and wall of buttons. | **✅ PASS** | Custom horizontal scrolling track keeps filters visible, swipeable, and clean. |
| **Navigation** | Lens Selector | Horizontal row of 8 lens options. | **✅ PASS** | Smooth swipe action; active lens clearly marked. |
| **Navigation** | Operations Row | Starred only, Export/Import, Leaderboard, Theme. | **✅ PASS** | Transformed 2-column wrapping grid into a swipeable touch-friendly horizontal track. |
| **Glossary** | Card Flipping | Flip interaction on tapping card content. | **✅ PASS** | Clicking card triggers smooth CSS Y-rotation without interference from the star button. |
| **Glossary** | Star Action | Easy starring from the grid. | **✅ PASS** | Star button has been expanded to a 44x44px absolute target, easily reachable without accidentally flipping cards. |
| **Study Mode** | Navigation & Shuffle | Previous, Next, and Shuffle buttons. | **✅ PASS** | Large 44px tap targets centered and spaced for easy one-handed reach. |
| **Quiz Mode** | On-Screen Keyboard | Focus on input stays visible above keyboard. | **✅ PASS** | On focus, smooth-scrolling moves inputs to screen center. Auto-zoom prevented using `font-size: 16px`. |
| **Leaderboard** | Modal & Table | Display top 10 scores and close popup. | **✅ PASS** | Panel automatically fits screen size, scrolling inside is fluid, and close target is a large 44px icon button. |
| **Code Lab** | Walkthrough & Blocks | View code segment line-by-line and analogies. | **✅ PASS** | Code segments scroll horizontally (`overflow-x: auto`) rather than overflowing page body. |

---

## On-Screen Keyboard Behavior Details

- **Auto-Zoom Prevention:** Standard iOS behavior triggers a page zoom if any input has a font size lower than 16px. By setting the font size of `#search`, `#quizInput`, and `#quizNameInput` to `16px` on mobile, the viewport remains beautifully locked and stable without any forced horizontal shifting.
- **Scroll on Focus:** Smooth scrolling listeners automatically center the input fields in the visual viewport upon focus. This guarantees they stay clear of the soft keyboard across Android Gboard and iOS touch keyboards.
