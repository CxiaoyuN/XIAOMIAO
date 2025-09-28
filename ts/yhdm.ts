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

  async getCategory() {
    return [
      { id: 'ribendongman', text: '日本动漫' },
      { id: 'guochandongman', text: '国产动漫' },
      { id: 'dongmandianying', text: '动漫电影' },
      { id: 'oumeidongman', text: '欧美动漫' },
    ];
  }

  async getCategoryDetail() {
    const cateId = env.get('cateId') ?? env.get('id');
    const page = env.get('page') ?? 1;
    const url = `${env.baseUrl}/type/${cateId}${page > 1 ? `-${page}` : ''}.html`;
    const html = await reqBrowser(url);
    const $ = kitty.load(html);

    return $('.item').toArray().map<Movie>(el => {
      const a = $(el).find('a');
      const img = $(el).find('img');
      const id = a.attr('href') ?? '';
      const title = img.attr('alt') ?? '';
      const cover = 'https:' + (img.attr('data-src') ?? img.attr('src') ?? '');
      return { id, title, cover, desc: '', remark: '', playlist: [] };
    });
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const url = `${env.baseUrl}/search/${encodeURIComponent(keyword)}`;
    const html = await reqBrowser(url);
    const $ = kitty.load(html);

    return $('.item').toArray().map<Movie>(el => {
      const a = $(el).find('a');
      const img = $(el).find('img');
      const id = a.attr('href') ?? '';
      const title = img.attr('alt') ?? '';
      const cover = 'https:' + (img.attr('data-src') ?? img.attr('src') ?? '');
      return { id, title, cover, desc: '', remark: '', playlist: [] };
    });
  }

  async getDetail() {
    const id = env.get('movieId');
    const url = `${env.baseUrl}${id}`;
    const html = await reqBrowser(url);
    const $ = kitty.load(html);

    const title = $('h1').text().trim();
    const cover = 'https:' + ($('img.lazyload').attr('data-src') ?? '');
    const desc = $('.info p').text().trim();
    const remark = $('.info span').text().trim();

    const playlist: Playlist[] = [];
    $('.movurl').each((_, el) => {
      const name = $(el).find('h2').text().trim();
      const videos: Video[] = $(el).find('li a').toArray().map(a => ({
        id: $(a).attr('href') ?? '',
        name: $(a).text().trim(),
      }));
      playlist.push({ name, videos });
    });

    return { id, title, cover, desc, remark, playlist };
  }

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env);
  }
}
