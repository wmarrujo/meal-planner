import adapter from "@sveltejs/adapter-static"
import {vitePreprocess} from "@sveltejs/vite-plugin-svelte"
import path from "path"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],
	onwarn: (warning, handler) => {
		if (warning.code == "css-unused-selector") return // disable this warning
		handler(warning)
	},
	kit: {
		adapter: adapter(),
		alias: {
			$routes: path.resolve("src/routes"),
			$schema: path.resolve("./supabase/database.types.ts"),
		},
		paths: {base: process.env.NODE_ENV == "development" ? "" : "/meal-planner"}, // will be stored here in github pages
	},
}

export default config
