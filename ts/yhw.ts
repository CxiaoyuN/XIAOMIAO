import { Handle, Movie, Playlist } from '@/types';

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
    const url = `${env.baseUrl}/show/${cateId}--------${page}---.html`;
    const html = await reqBrowser(url);
    const $ = kitty.load(html);

    if (env.get('debug')) {
      console.log('[DEBUG] 分类页 URL:', url);
      console.log('[DEBUG] HTML 片段:', html.slice(0, 300));
    }

    return $('.hl-item').toArray().map<Movie>(el => {
      const a = $(el).find('.hl-item-thumb');
      const id = a.attr('href') ?? '';
      const title = a.attr('title') ?? '';
      const cover = a.attr('data-original') ?? '';
      const remark = $(el).find('.remarks').text().trim();
      return { id, title, cover, remark, desc: '', playlist: [] };
    });
  }

  async getSearch() {
    const keyword = env.get('keyword');
    if (!keyword) return [];
    const url = `${env.baseUrl}/search/${encodeURIComponent(keyword)}-------------.html`;
    const html = await reqBrowser(url);
    const $ = kitty.load(html);

    if (env.get('debug')) {
      console.log('[DEBUG] 搜索 URL:', url);
      console.log('[DEBUG] HTML 片段:', html.slice(0, 300));
    }

    return $('.hl-item').toArray().map<Movie>(el => {
      const a = $(el).find('.hl-item-thumb');
      const id = a.attr('href') ?? '';
      const title = a.attr('title') ?? '';
      const cover = a.attr('data-original') ?? '';
      const remark = $(el).find('.remarks').text().trim();
      return { id, title, cover, remark, desc: '', playlist: [] };
    });
  }

  async getDetail() {
    const id = env.get('movieId');
    const url = `${env.baseUrl}${id}`;
    const html = await reqBrowser(url);
    const $ = kitty.load(html);

    if (env.get('debug')) {
      console.log('[DEBUG] 详情页 URL:', url);
      console.log('[DEBUG] HTML 片段:', html.slice(0, 300));
    }

    const title = $('h1').text().trim();
    const cover = $('.hl-item-thumb img').attr('data-original') ?? '';
    const desc = $('.hl-item-text').text().trim();
    const remark = $('.hl-item-sub').text().trim();

    const playlist: Playlist[] = [];
    $('.hl-plays-list').each((_, el) => {
      const name = $(el).find('.hl-plays-title').text().trim();
      const urls = $(el).find('ul a').toArray().map(a => ({
        title: $(a).text().trim(),
        url: $(a).attr('href') ?? '',
      }));
      playlist.push({ name, urls });
    });

    return { id, title, cover, desc, remark, playlist };
  }

  async parsePlayUrl() {
    const playUrl = env.get('playUrl');
    const url = `${env.baseUrl}${playUrl.replace(/\?real=1|\?raw=1/, '')}`;
    const html = await reqBrowser(url);

    if (env.get('debug')) {
      console.log('[DEBUG] 播放页 URL:', url);
      console.log('[DEBUG] HTML 片段:', html.slice(0, 300));
    }

    // 优先 iframe
    const iframe = html.match(/<iframe[^>]+src="([^"]+)"/)?.[1];
    if (iframe) {
      return kitty.utils.getM3u8WithIframe({ iframe });
    }

    // 尝试 base64 解码
    const match = html.match(/player_aaaa\s*=\s*{[^}]*"url"\s*:\s*"([^"]+)"/);
    if (match) {
      try {
        const decoded = kitty.utils.base64Decode(decodeURIComponent(match[1]));
        return { url: decoded };
      } catch (e) {
        console.warn('[DEBUG] base64 解码失败:', e);
      }
    }

    return { url: '' };
  }
}
