# Mariyam Shebaloy V8

This package is a **safe patch for the current V7 repository**. It keeps the existing Dashboard, Supabase login/cloud sync, Settings/Profile, Disease Templates and Medicine Database.

## What V8 restores

- New Patient: database medicine + custom medicine
- New Patient: investigations with add/remove
- New Patient: follow-up days/date
- New Visit: investigations with add/remove
- New Visit: follow-up days/date
- Save and Print are separate
- Print no longer runs automatically after Save
- Print prescription uses current Settings/Profile data
- Prescription list and Print buttons
- Patient/visit records continue through the existing `save()` cloud-sync mechanism

## Important

Do NOT delete the existing V7 `index.html`.

Upload `v8-patch.js` to the same GitHub repository, then add this line at the very end of `index.html`, immediately before `</body>`:

<script src="./v8-patch.js"></script>

Keep the existing Supabase script and `config.js`.

Then commit the changes and wait for GitHub Pages to redeploy.

## Supabase

`config.js` is already filled with the public project URL and publishable key you supplied.

Do not put a Supabase service-role/secret key in this file.
