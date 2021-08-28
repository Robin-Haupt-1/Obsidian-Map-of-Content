import typescript from '@rollup/plugin-typescript';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from "svelte-preprocess";
import autoPreprocess from 'svelte-preprocess';
import css from 'rollup-plugin-css-only';

const isProd = (process.env.BUILD === 'production');

const banner = 
`/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/
`;

export default {
  input: 'main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    sourcemapExcludeSources: isProd,
    format: 'cjs',
    exports: 'default',
    banner,
  },
  external: ['obsidian'],
  plugins: [
svelte({emitCss: false, preprocess: autoPreprocess() ,compilerOptions: {
				// enable run-time checks when not in production
				dev: !isProd 
			}}),
    typescript({
			sourceMap: !isProd ,
			inlineSources: !isProd 
		}),
    nodeResolve({browser: true}),
    commonjs(),css(),
  ]
};