// Official Vue SFC ambient module shim boilerplate — the empty props/emits
// object and `any` instance type are required by Vue's own type definitions.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
declare module '*.vue' { import type { DefineComponent } from 'vue'; const component: DefineComponent<{}, {}, any>; export default component; }
