import { env, req, kitty } from '../utils';
import type { Iconfig, ICategory, IMovie, IPlaylist } from '../types';

export default class Czzy {
  getConfig(): Iconfig {
    return {
      id: 'czzy',
      name: '厂长资源',
      api: 'https://www.cz4k.com',
      nsfw: false,
      type: 1,
    };
  }

  async getCategory(): Promise<ICategory[]> {
    return [
      { text: '最新电影', id: '最新电影' },
      { text: '剧场版', id: '剧场版' },
      { text: '国产剧', id: '国产剧' },
      { text: '美剧', id: '美剧' },
      { text: '韩剧', id: '韩剧' },
      { text: '番剧', id: '番剧' },
    ];
  }

  // 用搜索接口模拟分类页
  async getHome(): Promise<IMovie[]> {
    const cate = env.get('category');
    const page = env.get('page') || 1;
    const url = `${env.baseUrl}/xsss1O1?q=${encodeURIComponent(cate)}&page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $('.bt_img li').toArray().map<IMovie>(item => {
      const a = $(item).find('a').first();
      const id = a.attr('href')?.replace(env.baseUrl, '') ?? '';
      const title = $(item).find('h3.dytit a').text().trim();
      const cover = a.find('img').attr('data-original') ?? '';
      const desc = $(item).find('p.inzhuy').text().trim();
      const remark = $(item).find('.rating').text().trim();
      return { id, title, cover, desc, remark, playlist: [] };
    });
  }

  async getSearch(): Promise<IMovie[]> {
    const keyword = env.get('keyword');
    const page = env.get('page') || 1;
    const url = `${env.baseUrl}/xsss1O1?q=${encodeURIComponent(keyword)}&page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $('.bt_img li').toArray().map<IMovie>(item => {
      const a = $(item).find('a').first();
      const id = a.attr('href')?.replace(env.baseUrl, '') ?? '';
      const title = $(item).find('h3.dytit a').text().trim();
      const cover = a.find('img').attr('data-original') ?? '';
      const desc = $(item).find('p.inzhuy').text().trim();
      const remark = $(item).find('.rating').text().trim();
      return { id, title, cover, desc, remark, playlist: [] };
    });
  }

  async getDetail(): Promise<IMovie> {
    const id = env.get('movieId');
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const title = $('h1, h3').first().text().trim();
    const cover = $('.video_box img').attr('data-original') ?? '';
    const desc = $('.ttmtiart').text().trim();

    const iframeUrl = $('iframe.viframe').attr('src') ?? '';
    const realUrl = iframeUrl.includes('url=') ? decodeURIComponent(iframeUrl.split('url=')[1]) : '';
    const simulatedPlayUrl = iframeUrl;

    // 选集支持（如果存在）
    const episodes = $('.stui-content__playlist a').toArray().map(el => {
      const text = $(el).text().trim();
      const href = $(el).attr('href') ?? '';
      return { text, url: `${env.baseUrl}${href}` };
    });

    const playlist: IPlaylist[] = [{
      title: '播放选项',
      videos: [
        { text: '🔗 原网页播放', url },
        { text: '▶️ 模拟官网播放', url: simulatedPlayUrl },
        { text: '🎞️ 真实链接（可能受限）', url: realUrl },
        ...episodes,
      ],
    }];

    return { id, title, cover, desc, remark: '', playlist };
  }
}
