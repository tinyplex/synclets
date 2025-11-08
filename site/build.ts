import {readFileSync, writeFileSync} from 'fs';
import type {Docs} from 'tinydocs';
import {createDocs, getSorter} from 'tinydocs';
import {ArticleInner} from './ui/ArticleInner.tsx';
import {NavJson} from './ui/NavJson.tsx';
import {Page} from './ui/Page.tsx';
import {Readme} from './ui/Readme.tsx';

const GROUPS = ['Interfaces', '*', 'Type aliases'];
const CATEGORIES = [
  /Synclet/,
  /DataConnector/,
  /MetaConnector/,
  /Transport/,
  '*',
];
const REFLECTIONS = [
  'synclets',
  /Synclet/,
  /DataConnector/,
  /MetaConnector/,
  /Transport/,
  'utils',
  /^connector/,
  /^transport/,
  /^get/,
  /^set/,
  '*',
  /^del/,
];

export const build = async (
  outDir: string,
  api: boolean,
  pages: boolean,
  modules: string[],
): Promise<void> => {
  const {version} = JSON.parse(readFileSync('./package.json', 'utf-8'));

  const baseUrl = version.includes('beta')
    ? 'https://beta.synclets.org'
    : 'https://synclets.org';
  writeFileSync(
    'site/js/version.ts',
    `export const thisVersion = 'v${version}';`,
    'utf-8',
  );

  const docs = createDocs(baseUrl, outDir, !api && !pages)
    .addJsFile('site/js/home.ts')
    .addJsFile('site/js/app.ts')
    .addJsFile('site/js/single.ts')
    .addLessFile('site/less/index.less')
    .addDir('site/fonts', 'fonts')
    .addDir('site/extras');

  if (api) {
    addApi(docs, modules);
  }
  if (pages) {
    addPages(docs);
  }
  if (api || pages) {
    (
      await docs.generateNodes({
        group: getSorter(GROUPS),
        category: getSorter(CATEGORIES),
        reflection: getSorter(REFLECTIONS),
      })
    )
      .addPageForEachNode('/', Page)
      .addPageForEachNode('/', ArticleInner, 'article.html')
      .addTextForEachNode('/', NavJson, 'nav.json')
      .addPageForNode('/api/', Page, 'all.html', true)
      .addMarkdownForNode('/', Readme, '../readme.md')
      .addMarkdownForNode('/guides/releases/', Readme, '../../../releases.md');
  }

  docs.publish();

  if (api || pages) {
    const pagesTable: {[url: string]: {n: string; s: string}} = {};
    docs.forEachNode((node) => {
      const summary =
        node.summary
          ?.replaceAll(/<[^>]*>/g, '')
          .replaceAll(/\s+/g, ' ')
          .trim() ?? '';
      if (node?.url != '/' && summary && !summary.startsWith('->')) {
        pagesTable[node.url] = {
          n: node.name,
          s: summary,
        };
      }
    });
    writeFileSync(
      `${outDir}/pages.json`,
      JSON.stringify([{p: pagesTable}, {}]),
      'utf-8',
    );
  }
};

const addApi = (docs: Docs, modules: string[]) =>
  modules.forEach((module) => {
    docs.addApiFile(`dist/@types/${module}${module ? '/' : ''}index.d.ts`);
  });

const addPages = (docs: Docs): Docs =>
  docs.addRootMarkdownFile('site/home/index.md').addMarkdownDir('site/guides');
