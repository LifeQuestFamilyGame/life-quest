# Life Quest

A family game about small daily choices that add up. Real habits power an RPG character, and one story choice a day plays out with two dice.

- `src/content` – habits, Chapter 1 story cards, Habit Roll and Sunday check-up text, shop items
- `src/engine` – the game rules (tested in `tests/engine.test.js`)
- `src/data` – Firebase (Firestore + email logins) and a browser-only practice mode
- `src/screens` – the kids' tablet screens and the parents' Game Master screen

Run `npm install`, then `npm test` and `npm run build`. Add `?practice` to the address to play without logging in.
The `gh-pages` branch holds the built site.
