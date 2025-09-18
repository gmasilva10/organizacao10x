import type { Config } from "tailwindcss"

export default {
    content: [
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./pages/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    darkMode: ["class", "dark"],
    theme: {
        extend: {
            colors: {
                primary: "#5B7CFA",
                accent: "#22D3EE",
                background: "#F8FAFC",
                foreground: "#0F172A",
                border: "var(--border)",
                ring: "var(--ring)",
                input: "var(--input)",
                muted: "var(--muted)",
                "muted-foreground": "var(--muted-foreground)",
                card: "var(--card)",
                "card-foreground": "var(--card-foreground)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config
