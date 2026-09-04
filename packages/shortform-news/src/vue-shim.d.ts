// Standard Vue SFC ambient module shim (official Vue TS boilerplate) — the
// generic `{}, {}, any` here is required by Vue's own type definition, not
// application code.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
declare module '*.vue' { import type { DefineComponent } from 'vue'; const component: DefineComponent<{}, {}, any>; export default component; }
