export default class SakuraAnime implements Handle {
  getConfig() {
    return {
      id: 'sakura295yhw',
      name: '樱花动漫_新',
      api: 'https://www.295yhw.com',
      type: 1,
      nsfw: false,
    };
  }

  async getHome() {
    const html = await req(`${env.baseUrl}/`);
    const $ = kitty.load(html);
    const items = $('.video a').toArray().map(el => {
      const id = $(el).attr('href') ?? '';
      const title = $(el).find('p').text().trim();
      const cover = $(el).find('img').attr('src') ?? '';
      return { id, title, cover, desc: '', remark: '', playlist: [] };
    });
    return items;
  }

  async getCategory() {
    return [
      { text: '日本动漫', id: 'japan' },
      { text: '国产动漫', id: 'china' },
      { text: '欧美动漫', id: 'western' },
    ];
  }

  async getCategoryDetail() {
    const cateId = env.get('cateId');
    const page = env.get('page');
    const html = await req(`${env.baseUrl}/show/${cateId}-${page}.html`);
    const $ = kitty.load(html);
    const items = $('.video a').toArray().map(el => {
      const id = $(el).attr('href') ?? '';
      const title = $(el).find('p').text().trim();
      const cover = $(el).find('img').attr('src') ?? '';
      return { id, title, cover, desc: '', remark: '', playlist: [] };
    });
    return items;
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const html = await req(`${env.baseUrl}/search.html?wd=${keyword}`);
    const $ = kitty.load(html);
    const items = $('.video a').toArray().map(el => {
      const id = $(el).attr('href') ?? '';
      const title = $(el).find('p').text().trim();
      const cover = $(el).find('img').attr('src') ?? '';
      return { id, title, cover, desc: '', remark: '', playlist: [] };
    });
    return items;
  }

  async getDetail() {
    const id = env.get('movieId');
    const html = await req(`${env.baseUrl}${id}`);
    const $ = kitty.load(html);
    const title = $('h1').text().trim();
    const cover = $('.video img').attr('src') ?? '';
    const remark = $('.score').text().trim();
    const playlist: Playlist[] = [];

    $('.play-list').each((_, el) => {
      const name = $(el).find('h2').text().trim();
      const videos = $(el).find('a').toArray().map(a => ({
        title: $(a).text().trim(),
        url: $(a).attr('href') ?? '',
      }));
      playlist.push({ name, urls: videos });
    });

    return { id, title, cover, desc: '', remark, playlist };
  }

  async parsePlayUrl() {
    const playUrl = env.get('playUrl');
    const html = await req(`${env.baseUrl}${playUrl}`);
    const iframeSrc = kitty.load(html)('iframe').attr('src');
    return kitty.utils.getM3u8WithIframe({ iframe: iframeSrc });
  }
}
