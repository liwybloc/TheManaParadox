import { createApp } from "vue";
import App from "@ui/App.vue";
import { namedWasm } from "../generated/_wasm$globals.js";
import "./background.js";
import "./player.js";
import "./save.js";
import "./tick.js";

(globalThis as any).cheatSomeCookies = namedWasm.cheatSomeCookies;

createApp(App).mount("#root");
