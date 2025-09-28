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

  // 动态解析首页导航分类
  async getCategory() {
    const url = `${env.baseUrl}/`;
    const html = await reqBrowser(url);
    const $ = kitty.load(html);

    if (env.get('debug')) {
      console.log('[DEBUG] 分类导航 URL:', url);
      console.log('[DEBUG] HTML 片段:', html.slice(0, 200));
    }

    const categories: { id: string; text: string }[] = [];
    $('.myui-header__menu a').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      const match = href.match(/\/type\/([^/]+)\.html/);
      if (match) {
        categories.push({ id: match[1], text });
      }
    });
    return categories;
  }

  async getCategoryDetail() {
    const cateId = env.get('cateId') ?? env.get('id');
    const page = env.get('page') ?? 1;
    const url = `${env.baseUrl}/type/${cateId}${page > 1 ? `-${page}` : ''}.html`;
    const html = await reqBrowser(url);
    const $ = kitty.load(html);

    if (env.get('debug')) {
      console.log('[DEBUG] 分类页 URL:', url);
      console.log('[DEBUG] HTML 长度:', html.length);
    }

    return $('.myui-vodlist__box').toArray().map<Movie>(el => {
      const a = $(el).find('a');
      const img = $(el).find('a img');
      const id = a.attr('href') ?? '';
      const title = img.attr('alt') ?? '';
      const cover = img.attr('data-original') ?? img.attr('src') ?? '';
      const remark = $(el).find('.pic-text').text().trim();
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
      console.log('[DEBUG] HTML 长度:', html.length);
    }

    return $('.myui-vodlist__box').toArray().map<Movie>(el => {
      const a = $(el).find('a');
      const img = $(el).find('a img');
      const id = a.attr('href') ?? '';
      const title = img.attr('alt') ?? '';
      const cover = img.attr('data-original') ?? img.attr('src') ?? '';
      const remark = $(el).find('.pic-text').text().trim();
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
      console.log('[DEBUG] HTML 长度:', html.length);
    }

    const title = $('h1').text().trim();
    const cover = $('.lazyload').attr('data-original') ?? '';
    const desc = $('.content p').text().trim();
    const remark = $('.data span').first().text().trim();

    const playlist: Playlist[] = [];
    $('.stui-content__playlist').each((_, el) => {
      const name = $(el).prev('h3').text().trim() || '播放列表';
      const videos: Video[] = $(el).find('a').toArray().map(a => ({
        id: $(a).attr('href') ?? '',
        name: $(a).text().trim(),
      }));
      playlist.push({ name, videos });
    });

    return { id, title, cover, desc, remark, playlist };
  }

  async parseIframe() {
    try {
      return await kitty.utils.getM3u8WithIframe(env);
    } catch (e) {
      console.warn('[DEBUG] parseIframe 异常:', e);
      return { url: '' };
    }
  }
}
