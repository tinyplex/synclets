import {transformSync} from 'esbuild';
import {readFileSync, readdirSync} from 'fs';
import {join, resolve} from 'path';

import {describe, expect, test} from 'vitest';
import {AsyncFunction, getTimeFunctions} from './common.ts';

const MODULES = [
  ...Object.keys(
    JSON.parse(
      readFileSync(join(__dirname, '../../src/tsconfig.json'), 'utf-8'),
    ).compilerOptions.paths,
  )
    .filter((alias) => alias.startsWith('@synclets/@types'))
    .filter((alias) => !alias.includes('durable-object'))
    .map((alias) => alias.replace('@synclets/@types', 'synclets')),
].concat(['ws', 'fs', '@electric-sql/pglite', 'sqlite3']);

const [reset, _getNow, pause] = getTimeFunctions();

Object.assign(globalThis as any, {pause, reset});
(globalThis as any).modules = {};
await Promise.all(
  MODULES.map(async (module) => {
    (globalThis as any).modules[module] = await import(module);
  }),
);

type Results = [any, any][];

const resultsByName: {[name: string]: () => Promise<Results>} = {};

const forEachDeepFile = (
  dir: string,
  callback: (file: string) => void,
  extension = '',
): void =>
  forEachDirAndFile(
    dir,
    (dir) => forEachDeepFile(dir, callback, extension),
    (file) => callback(file),
    extension,
  );

const forEachDirAndFile = (
  dir: string,
  dirCallback: ((dir: string) => void) | null,
  fileCallback?: (file: string) => void,
  extension = '',
): void =>
  readdirSync(dir, {withFileTypes: true}).forEach((entry) => {
    const path = resolve(join(dir, entry.name));
    if (entry.isDirectory()) {
      dirCallback?.(path);
    } else if (path.endsWith(extension)) {
      fileCallback?.(path);
    }
  });

const prepareTestResultsFromBlock = (block: string, prefix: string): void => {
  const name = prefix + ' - ' + (block.match(/(?<=^).*?(?=\n)/) ?? '');
  let count = 1;
  let suffixedName = name;
  while (resultsByName[suffixedName] != null) {
    suffixedName = name + ' ' + ++count;
  }

  const tsx = block
    .match(new RegExp('(?<=```[tj]sx?\\n).*?(?=```)', 'gms'))
    ?.join('\n')
    ?.trim();
  if (tsx == null) {
    return;
  }

  let problem;
  if (tsx != '') {
    const realTsx =
      tsx
        ?.replace(/console\.log/gm, '_actual.push')
        ?.replace(
          /\/\/ ->\n(.*?);$/gms,
          (match, expected) =>
            '_expected.push(' + expected.replace(/\n\s*/gms, ``) + ');\n',
        )
        ?.replace(/\/\/ -> (.*?)$/gm, '_expected.push($1);\n')
        ?.replace(/\/\/ \.\.\.$/gm, 'await pause();\n')
        ?.replace(/\/\/ \.\.\. wait a moment.*$/gm, 'await pause(1000);\n')
        ?.replace(/\/\/ \.\.\. wait (\d+)ms.*$/gm, 'await pause($1);\n')
        ?.replace(/^(.*?) \/\/ !yolo$/gm, '')
        ?.replace(/\/\/ !reset$/gm, 'reset();')
        ?.replace(/\n+/g, '\n')
        ?.replace(
          /import (type )?(.*?) from '(.*?)';/gms,
          'const $2 = modules[`$3`];',
        )
        ?.replace(/export (const|class) /gm, '$1 ') ?? '';
    // lol what could go wrong
    try {
      const js = transformSync(realTsx, {loader: 'tsx'});
      resultsByName[suffixedName] = new AsyncFunction(`
        const _expected = [];
        const _actual = [];
        ${js.code}
        return Array(Math.max(_expected.length, _actual.length))
          .fill('')
          .map((_, r) => [_expected[r], _actual[r]]);`);
    } catch (e: any) {
      problem = `Could not parse example:\n-\n${name}\n-\n${e}\n-\n${realTsx}`;
    }
  } else {
    problem = `Could not find JavaScript in example: ${name}`;
  }
  expect(problem).toBeUndefined();
};

describe('Documentation tests', () => {
  forEachDeepFile(
    'src/@types',
    (file) =>
      readFileSync(file, 'utf-8')
        .match(/(?<=\* @example\n).*?(?=\s*(\*\/|\* @))/gms)
        ?.map((examples) => examples.replace(/^\s*?\* ?/gms, ''))
        ?.forEach((block) => prepareTestResultsFromBlock(block, file)),
    '.js',
  );
  ['site/guides', 'site/home'].forEach((root) =>
    forEachDeepFile(
      root,
      (file) => prepareTestResultsFromBlock(readFileSync(file, 'utf-8'), file),
      '.md',
    ),
  );

  test.each(Object.entries(resultsByName))('%s', async (_name, getResults) => {
    const results = await getResults();
    results.forEach(([expectedResult, actualResult]) => {
      expect(actualResult).toEqual(expectedResult);
    });
  });
});
