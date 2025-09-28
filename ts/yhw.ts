import { Handle, Playlist } from '@/types';

export default class YHW implements Handle {
  getConfig() {
    return {
      id: 'yhw',
      name: '樱花动漫',
      api: 'https://www.295yhw.com',
      type: 1,
      nsfw: false,
    };
  }

  private parseItems(html: string) {
    const regex = /hl-item-thumb[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*data-original="([^"]+)"[\s\S]*?remarks">([^<]*)</g;
    return [...html.matchAll(regex)].map(m => ({
      id: m[1],
      title: m[2],
      cover: m[3],
      remark: m[4].trim(),
      desc: '',
      playlist: [],
    }));
  }

  async getHome() {
    const html = await reqBrowser(`${env.baseUrl}/`);
    return this.parseItems(html);
  }

  async getCategory() {
    return [
      { text: '日本动漫', id: 'ribendongman' },
      { text: '国产动漫', id: 'guochandongman' },
      { text: '动漫电影', id: 'dongmandianying' },
      { text: '欧美动漫', id: 'omeidongman' },
    ];
  }

  async getCategoryDetail() {
    const cateId = env.get('cateId');
    const page = env.get('page') ?? 1;
    const html = await reqBrowser(`${env.baseUrl}/show/${cateId}--------${page}---.html`);
    return this.parseItems(html);
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const html = await reqBrowser(`${env.baseUrl}/search/${encodeURIComponent(keyword)}-------------.html`);
    return this.parseItems(html);
  }

  async getDetail() {
    const id = env.get('movieId');
    const html = await reqBrowser(`${env.baseUrl}${id}`);
    const $ = kitty.load(html);

    const title = $('h1').text().trim();
    const cover = $('.hl-item-thumb img').attr('data-original') ?? '';
    const desc = $('.hl-item-text').text().trim();
    const remark = $('.hl-item-sub').text().trim();

    const playlist: Playlist[] = [];
    $('.hl-plays-list').each((_, el) => {
      const name = $(el).find('.hl-plays-title').text().trim();
      const urls = [];
      $(el).find('ul a').each((_, a) => {
        const href = $(a).attr('href') ?? '';
        const text = $(a).text().trim();
        urls.push({ title: text, url: href });
      });
      playlist.push({ name, urls });
    });

    return { id, title, cover, desc, remark, playlist };
  }

  async parsePlayUrl() {
    const playUrl = env.get('playUrl');
    const cleanUrl = playUrl.replace(/\?real=1|\?raw=1/, '');
    const html = await reqBrowser(`${env.baseUrl}${cleanUrl}`);

    if (playUrl.includes('?raw=1')) {
      return {
        url: `${env.baseUrl}${cleanUrl}`,
        headers: { Referer: env.baseUrl },
      };
    }

    const match = html.match(/player_aaaa\s*=\s*{[^}]*"url"\s*:\s*"([^"]+)"/);
    if (match) {
      try {
        const encoded = decodeURIComponent(match[1]);
        const decoded = kitty.utils.base64Decode(encoded);
        if (decoded.includes('.mp4') || decoded.includes('.m3u8')) {
          return { url: decoded };
        }
      } catch (e) {
        console.warn('base64 decode failed', e);
      }
    }

    const iframe = html.match(/<iframe[^>]*src="([^"]+)"/)?.[1];
    if (iframe) {
      return kitty.utils.getM3u8WithIframe({ iframe });
    }

    return { url: '' };
  }
}
