import commonjs from '@rollup/plugin-commonjs';

export default {
  input: './index.js',
  output: {
    file: './dist/bundle.mjs',
    format: 'esm',
    sourcemap: true
  },
  plugins: [commonjs()]
};
