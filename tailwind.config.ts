import type {Config} from "tailwindcss"
import typography from "@tailwindcss/typography"
import daisyui from "daisyui"

const config: Config = {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	safelist: ["dark"],
	plugins: [typography, daisyui],
	daisyui: {
		themes: ["retro", "dracula"],
		darkTheme: "dracula",
	},
	darkMode: ["class", "[data-theme=\"dracula\"]"],
	theme: {
		screens: { // these px values are ranges of "_px AND UP"
			// nothing: phones in portrait
			"phones-only": {"max": "600px"},
			"tablet": "600px", // tablet portrait or phones in landscape
			"laptop": "1000px", // tablets in landscape or small monitors
			"monitor": "1800px", // regular monitors
		},
		container: {
			center: true,
			padding: "2rem",
		},
	},
}

export default config
