import babel from 'rollup-plugin-babel';

export default {
  input: './src/index',
  output: [
    {
      dir: 'build/cjs',
      format: 'cjs',
    },
    {
      dir: 'build/esm',
      format: 'esm',
    },
  ],
  plugins: [
    babel({
      rootMode: 'upward',
    }),
  ],
};
