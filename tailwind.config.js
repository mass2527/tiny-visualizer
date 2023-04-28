import { slate, blue } from "@radix-ui/colors";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        ...slate,
        ...blue,
      },
    },
  },
  plugins: [],
};
