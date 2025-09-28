import { Handle, Movie, Playlist, Video } from '@/types';

export default class YHDM implements Handle {
  getConfig() {
    return {
      id: 'yhdm',
      name: '樱花动漫_旧',
      api: 'https://www.857yhw.com',
      type: 1,
      nsfw: false,
    };
  }

  private parseItems($: cheerio.Root): Movie[] {
    const items: Movie[] = [];
    $('.item').each((_, el) => {
      const title = $(el).find('img').attr('alt') ?? '';
      const cover = 'https:' + ($(el).find('img').attr('data-src') ?? $(el).find('img').attr('src') ?? '');
      const id = $(el).find('a').attr('href') ?? '';
      items.push({ id, title, cover, desc: '', remark: '', playlist: [] });
    });
    return items;
  }

  async getHome() {
    const html = await reqBrowser(`${env.baseUrl}/`);
    const $ = kitty.load(html);
    return this.parseItems($);
  }

  async getCategory() {
    return [
      { id: 'ribendongman', text: '日本动漫' },
      { id: 'guochandongman', text: '国产动漫' },
      { id: 'dongmandianying', text: '动漫电影' },
      { id: 'oumeidongman', text: '欧美动漫' },
    ];
  }

  async getCategoryDetail() {
    const cateId = env.get('cateId');
    const page = env.get('page') ?? 1;
    const url = `${env.baseUrl}/type/${cateId}${page > 1 ? `-${page}` : ''}.html`;
    const html = await reqBrowser(url);
    const $ = kitty.load(html);
    return this.parseItems($);
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const html = await reqBrowser(`${env.baseUrl}/search/${keyword}`);
    const $ = kitty.load(html);
    return this.parseItems($);
  }

  async getDetail() {
    const id = env.get('movieId');
    const html = await reqBrowser(`${env.baseUrl}${id}`);
    const $ = kitty.load(html);

    const title = $('h1').first().text().trim();
    const cover = 'https:' + ($('img.lazyload').attr('data-src') ?? $('img.lazyload').attr('src') ?? '');
    const desc = $('.info p').text().trim();
    const remark = $('.info span').text().trim();

    const playlist: Playlist[] = [];
    $('.movurl').each((_, el) => {
      const name = $(el).find('h2').text().trim();
      const videos: Video[] = [];
      $(el).find('li a').each((_, a) => {
        const text = $(a).text().trim();
        const href = $(a).attr('href') ?? '';
        videos.push({ id: href, name: text });
      });
      playlist.push({ name, videos });
    });

    return { id, title, cover, desc, remark, playlist };
  }

  async parseIframe() {
    try {
      return await kitty.utils.getM3u8WithIframe(env);
    } catch (e) {
      console.warn('parseIframe failed', e);
      return { url: '' };
    }
  }
}
