import { gray, blue } from "@radix-ui/colors";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        ...gray,
        ...blue,
      },
    },
  },
  plugins: [],
};
