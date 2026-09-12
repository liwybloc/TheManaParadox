import { createApp } from "vue";
import App from "@ui/App.vue";
import { namedWasm } from "../generated/_wasm$globals.js";
import "./background.js";
import "./player.js";
import "./scratch.js";
import "./achievements.js";
import "./currencies.js";
import "./tier_one.js";
import "./progression.js";
import "./debug.js";
import "./save.js";
import "./tick.js";

(globalThis as any).cheatSomeCookies = namedWasm.cheatSomeCookies;

createApp(App).mount("#root");
