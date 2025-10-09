export default class LiuYueTingShu implements Handle {
  getConfig() {
    return {
      id: '5weiting',
      name: '六月听书网',
      api: 'http://www.5weiting.com',
      type: 3, // 音频类
      nsfw: false
    }
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const html = await req(`${env.baseUrl}/search/${encodeURIComponent(keyword)}/1`);
    const $ = kitty.load(html);
    const results = [];

    $('.album-list .album-item').each((_, el) => {
      const title = $(el).find('.book-item-name a').text().trim();
      const cover = $(el).find('.book-item-img img').attr('src');
      const url = $(el).find('.book-item-name a').attr('href');
      results.push({ title, cover, url });
    });

    return { list: results };
  }

  async getDetail() {
    const url = env.get('url');
    const html = await req(`${env.baseUrl}${url}`);
    const $ = kitty.load(html);

    const title = $('.book-item-name a').text().trim();
    const cover = $('.book-item-img img').attr('src');
    const desc = $('.book-item-desc').text().trim();
    const episodes = [];

    $('.play-list ul.list li a').each((_, el) => {
      const name = $(el).text().trim();
      const href = $(el).attr('href');
      episodes.push({ name, url: href });
    });

    return { title, cover, desc, episodes };
  }

  async parseIframe() {
    const url = env.get('url');
    const html = await req(`${env.baseUrl}${url}`);
    const $ = kitty.load(html);
    const iframeSrc = $('iframe').attr('src');
    return { url: iframeSrc };
  }
}
