# Think Like Me

A personal writing coach for a Grade 7 student learning Swedish as a second language (Svenska som andraspråk). It helps with clarity while preserving the student's own ideas and voice.

## What it does
- Small, voice-preserving Swedish edits rather than a full adult-sounding rewrite
- Simple vocabulary and natural sentence flow for Grade 7 SVA
- Prompt rules that protect the student's meaning and treat drafts/notes as untrusted input
- Uses the selected notes and saved writing preferences as context
- Feedback stays short, kind, and in the draft's language
- Never adds facts or deliberately inserts mistakes

## AI connection
The frontend calls the `writing-assistant` Edge Function in the separate Think Like Me Supabase project. That function proxies to the `writing-assistant-bridge` function in SnapStudy. The writing app does not contain provider API keys.

Supabase project (writing app): `ihonwomrhvdgfmjjjtyr`

SnapStudy project: `thqxjxrtcvcrnqnnmjzi`

### One-time server secrets
The Supabase management connector cannot set Edge Function secrets, so finish the private server-to-server connection in the Supabase Dashboard. Create a long random shared secret using a password manager (at least 32 random bytes) and set the **same value** in both projects:

- In SnapStudy project Edge Function secrets, set `WRITING_BRIDGE_SECRET`.
- In Think Like Me project Edge Function secrets, set `SNAPSTUDY_WRITING_BRIDGE_SECRET`.

SnapStudy's bridge reads the provider secrets already configured in that project (Gemini and/or Groq). No provider key needs to be copied to Think Like Me. Do not put the shared bridge secret or provider keys in frontend code, GitHub, or chat.

Dashboard links:
- [Think Like Me Edge Function secrets](https://supabase.com/dashboard/project/ihonwomrhvdgfmjjjtyr/settings/functions)
- [SnapStudy Edge Function secrets](https://supabase.com/dashboard/project/thqxjxrtcvcrnqnnmjzi/settings/functions)

After setting both secrets, test the writing assistant in the deployed app.

## Run locally
`npm install`
`npm run dev`

## Storage
Notes and writing preferences currently stay in this browser's localStorage. They are not synced between devices.
