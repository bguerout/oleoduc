import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "./index.mjs",
  output: {
    file: "./dist/cjs/index.js",
    format: "cjs",
    sourcemap: true,
  },
  plugins: [commonjs()],
};
