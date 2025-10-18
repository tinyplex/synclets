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
  api = true,
  pages = true,
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
    addApi(docs);
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
};

const addApi = (docs: Docs): Docs =>
  docs
    .addApiFile('dist/@types/index.d.ts')
    .addApiFile('dist/@types/utils/index.d.ts')
    .addApiFile('dist/@types/connector/fs/index.d.ts')
    .addApiFile('dist/@types/connector/memory/index.d.ts')
    .addApiFile('dist/@types/connector/pglite/index.d.ts')
    .addApiFile('dist/@types/server/stateless-ws/index.d.ts')
    .addApiFile('dist/@types/transport/memory/index.d.ts')
    .addApiFile('dist/@types/transport/ws/index.d.ts');

const addPages = (docs: Docs): Docs =>
  docs.addRootMarkdownFile('site/home/index.md').addMarkdownDir('site/guides');
