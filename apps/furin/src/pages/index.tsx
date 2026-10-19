import { defineRoute } from "@teyik0/furin";
export const route = defineRoute("/").config({ mode: "ssr" }).page(() => <main>Furin benchmark</main>);
