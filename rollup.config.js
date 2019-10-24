import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

export default {
  input: {
    index: 'src/index.ts',
    runCli: 'src/cli/index.ts',
  },
  output: {
    dir: 'bundled',
    format: 'cjs',
  },
  external: ['child_process', 'os', 'path', 'fs', 'util'],
  plugins: [
    resolve({ extensions }),
    commonjs({
      namedExports: {
        './lib/main.js': ['__moduleExports'],
      },
    }),
    babel({ extensions }),
  ],
};
