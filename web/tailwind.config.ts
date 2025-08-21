import type { Config } from "tailwindcss"

export default {
	darkMode: ["class", "dark"],
	theme: {
		extend: {
			colors: {
				primary: "#5B7CFA",
				accent: "#22D3EE",
				background: "#F8FAFC",
				foreground: "#0F172A",
			},
		},
	},
} satisfies Config
