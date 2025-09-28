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
    const url = `${env.baseUrl}/`;
    const html = await reqBrowser(url);
    const $ = kitty.load(html);

    if (env.get('debug')) {
      console.log('[DEBUG] 分类导航 URL:', url);
      console.log('[DEBUG] HTML 片段:', html.slice(0, 300));
    }

    const categories: { id: string; text: string }[] = [];
    $('.nav-menu a').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      const match = href.match(/\/show\/([^/]+)\.html/);
      if (match) {
        categories.push({ id: match[1], text });
      }
    });
    return categories;
  }

  async getCategoryDetail() {
    const cateId = env.get('cateId') ?? env.get('id');
    const page = env.get('page') ?? 1;
    const url = `${env.baseUrl}/show/${cateId}--------${page}---.html`;
    const html = await reqBrowser(url);
    const $ = kitty.load(html);

    if (env.get('debug')) {
      console.log('[DEBUG] 分类页 URL:', url);
      console.log('[DEBUG] HTML 长度:', html.length);
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
      console.log('[DEBUG] HTML 长度:', html.length);
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
      console.log('[DEBUG] HTML 长度:', html.length);
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
    const url = `${env.baseUrl}${playUrl.replace(/\?real=1
