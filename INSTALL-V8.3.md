# Mariyam Shebaloy V8.3 Final Fix

This patch keeps the existing V7/V8 dashboard, Supabase login, profile, medicine database and cloud data flow.

## Changes in V8.3
- Investigation picker is a real in-app modal/button. The old mobile datalist/keyboard suggestion is disabled.
- Investigation modal stays on screen while selecting CBC, RBC, FBS, etc.; multiple tests can be selected and removed.
- Medicine PRN/"প্রয়োজন হলে" instructions are available in New Patient and New Visit, including presets for PRN, pain, fever, no pain, and custom text.
- Food labels are Bengali in the prescription workflow.
- Prescription print preview uses the earlier two-sided doctor/clinic header style with CC and OE sections, Rx layout, investigations, advice and follow-up.
- Print uses the current app window so popup-blocking is not required.

## Install
Replace the old `v8-patch.js` with this V8.3 file. Keep the existing `index.html` and other V7/V8 files.

`index.html` must load the patch after the main inline script:

```html
<script src="./v8-patch.js"></script>
```

After committing, hard-refresh/clear the old GitHub Pages cache or open the site in a private tab once so the new JS is loaded.
