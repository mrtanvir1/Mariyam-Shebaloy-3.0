# Mariyam Shebaloy V8.4 Final Fix

Replace the previous `v8-patch.js` with this file. Keep your existing `index.html`, `config.js`, Supabase setup, dashboard, auth, profile, medicines database and other files unchanged.

Ensure `index.html` contains this once, after the existing main script:

```html
<script src="./v8-patch.js"></script>
```

## V8.4 fixes
- Investigation selector is a real in-app modal; it does not use HTML datalist and does not open the keyboard suggestion list.
- A MutationObserver reapplies the selector if the New Patient/New Visit form is rerendered.
- Tapping/focusing the old investigation input is intercepted and opens the modal.
- Medicine PRN/custom instruction and Bengali food labels remain supported.
- Prescription preview keeps CC/OE two-column clinical layout, doctor/clinic split header, colored Rx section, medicine table, investigations, advice, follow-up and signature.

After GitHub Pages updates, test in Chrome Incognito once to avoid cached JavaScript.
