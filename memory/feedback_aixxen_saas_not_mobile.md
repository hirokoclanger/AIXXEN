---
name: feedback-aixxen-saas-not-mobile
description: AIXXEN is a desktop web SaaShelps enterprises never use phone/mobile frames for screenshots
metadata:
  type: feedback
---

AIXXEN is a desktop/browser web SaaS application. Screenshots must be shown in browser-style frames (with address bar chrome), never in iPhone or phone mockup frames.

**Why:** User explicitly corrected this mistakehelps enterprises phone frames were being used from memory of a different project (tourtour.app). The index.html confirms this: screenshots use `.shot` class which is a simple bordered rectangle, no device frame.

**How to apply:** Whenever displaying AIXXEN product screenshots on the marketing site, use a browser chrome frame (traffic lights + URL bar) or the existing `.shot` class. Never use phone frames, mobile mockups, or portrait-orientation device frames.
