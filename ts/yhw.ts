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
    const items = [...html.matchAll(regex)].map(m => ({
      id: m[1],
      title: m[2],
      cover: m[3],
      remark: m[4].trim(),
      desc: '',
      playlist: [],
    }));

    if (env.get('debug')) {
      console.log(`[DEBUG] 解析出 ${items.length} 个条目`);
    }

    return items;
  }

  async getHome() {
    const url = `${env.baseUrl}/`;
    const html = await reqBrowser(url);

    if (env.get('debug')) {
      console.log('[DEBUG] 首页请求地址:', url);
      console.log('[DEBUG] 首页页面片段:', html.slice(0, 500));
    }

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
    const url = `${env.baseUrl}/show/${cateId}--------${page}---.html`;
    const html = await reqBrowser(url);

    if (env.get('debug')) {
      console.log('[DEBUG] 分类页请求地址:', url);
      console.log('[DEBUG] 分类页页面片段:', html.slice(0, 500));
    }

    return this.parseItems(html);
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const url = `${env.baseUrl}/search/${encodeURIComponent(keyword)}-------------.html`;
    const html = await reqBrowser(url);

    if (env.get('debug')) {
      console.log('[DEBUG] 搜索请求地址:', url);
      console.log('[DEBUG] 搜索页面片段:', html.slice(0, 500));
    }

    return this.parseItems(html);
  }

  async getDetail() {
    const id = env.get('movieId');
    const url = `${env.baseUrl}${id}`;
    const html = await reqBrowser(url);

    if (env.get('debug')) {
      console.log('[DEBUG] 详情页请求地址:', url);
      console.log('[DEBUG] 详情页页面片段:', html.slice(0, 500));
    }

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
    const url = `${env.baseUrl}${cleanUrl}`;
    const html = await reqBrowser(url);

    if (env.get('debug')) {
      console.log('[DEBUG] 播放页请求地址:', url);
      console.log('[DEBUG] 播放页页面片段:', html.slice(0, 500));
    }

    if (playUrl.includes('?raw=1')) {
      return
