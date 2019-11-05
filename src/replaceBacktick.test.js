const esmRequire = require('esm')(module);
const MarkdownIt = require('markdown-it');
const replaceBacktick = esmRequire('./replaceBacktick').default;
const defaultStyle = esmRequire('./defaultStyle').default;
const cheerio = require('cheerio');

describe('replaceBacktick', () => {
  let md;

  beforeEach(() => {
    const mockReporter = {};
    ['log', 'info', 'warn', 'error', 'output', 'section'].forEach(
      m => (mockReporter[m] = jest.fn())
    );
    const backticks = replaceBacktick();
    md = MarkdownIt().use(backticks.register);
    backticks.reset(
      {
        references: {
          shimamura: { title: 'smiling ', doi: 'doi/1' },
          honda: { title: 'stars', doi: 'doi/2' }
        },
        refTagMap: new Map(),
        figures: { shibuya: { caption: 'flower' } },
        figTagMap: new Map(),
        styles: defaultStyle
      },
      mockReporter
    );
  });

  test('ref', () => {
    const $1 = cheerio.load(md.render('Hi `ref:shimamura`.'));
    expect($1('span.ref')).toHaveLength(1);

    const $2 = cheerio.load(md.render('Hi `ref:honda,shimamura`.'));
    expect($2('span.ref')).toHaveLength(2);

    expect(() => {
      md.render('Hi `ref:notfound`');
    }).toThrow('Unknown reference tag');
  });

  test('fig', () => {
    const $ = cheerio.load(md.render('fig `fig:shibuya`'));
    expect($('span.fig:contains("1")')).toHaveLength(1);

    expect(() => {
      md.render('Hi `fig:notfound`');
    }).toThrow('Unknown figure tag');
  });

  test('references', () => {
    const $ = cheerio.load(md.render('`ref:shimamura` `references`'));
    expect($('ol.references')).toHaveLength(1);
    const tag = $('li#ref-1');
    expect(tag).toHaveLength(1);
    expect(tag.text()).toContain('smiling');
  });

  test('figures', () => {
    const $ = cheerio.load(md.render('`fig:shibuya` `figures`'));
    expect($('figure#fig-1')).toHaveLength(1);
  });
});