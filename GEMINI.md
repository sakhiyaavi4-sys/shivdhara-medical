# Shiv Dhara Medical Store - Core Rules & Architecture

See full system documentation and operating rules in [AGENTS.md](file:///c:/Users/avisa/OneDrive/Desktop/shivdhara-medical/AGENTS.md).

## Critical AI Rules:
1. **Scope Bound:** Make only the exact changes requested by the user. Do not make unrequested edits.
2. **Single Center Button:** All "New Entry / New Bill / New Challan / New Return" buttons MUST only appear ONCE in the center of the screen when no bill is active. Never add duplicate buttons to top headers.
3. **Theme Consistency:** Always use `--color-primary`, `inp`, `lbl`, `btn()`, and standard app card styles.
4. **Build Verification:** Always test builds with `npm run build` after changes.
