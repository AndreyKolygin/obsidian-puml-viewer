import esbuild from 'esbuild';
import process from 'process';

const production = process.argv[2] === 'production';

const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron', '@codemirror/*'],
  format: 'cjs',
  target: 'es2020',
  logLevel: 'info',
  sourcemap: production ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  platform: 'browser',
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
