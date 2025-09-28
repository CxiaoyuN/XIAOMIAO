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
      { text: '电影', id: 'zuixindianying' },
      { text: '剧场', id: 'dongmanjuchangban' },
      { text: '国产', id: 'gcj' },
      { text: '美剧', id: 'meijutt' },
      { text: '韩剧', id: 'hanjutv' },
      { text: '番剧', id: 'fanju' },
    ];
  }

  async getHome(): Promise<IMovie[]> {
    const cate = env.get('category');
    const page = env.get('page') || 1;
    const url = `${env.baseUrl}/${cate}/page/${page}`;
    const html = await req(url);
    const $ = kitty.load(html);
    return $('.bt_img li').toArray().map<IMovie>(item => {
      const a = $(item).find('a');
      const title = a.attr('title') ?? '';
      const id = a.attr('href') ?? '';
      const cover = a.find('img').attr('data-original') ?? '';
      return { id, title, cover, desc: '', remark: '', playlist: [] };
    });
  }

  async getSearch(): Promise<IMovie[]> {
    const keyword = env.get('keyword');
    const url = `${env.baseUrl}/xsss1O1?q=${encodeURIComponent(keyword)}`;
    const html = await req(url);
    const $ = kitty.load(html);
    return $('.bt_img li').toArray().map<IMovie>(item => {
      const a = $(item).find('a');
      const title = a.attr('title') ?? '';
      const id = a.attr('href') ?? '';
      const cover = a.find('img').attr('data-original') ?? '';
      return { id, title, cover, desc: '', remark: '', playlist: [] };
    });
  }

  async getDetail(): Promise<IMovie> {
    const id = env.get('movieId');
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const title = $('h3').first().text().trim();
    const cover = $('.video_box img').attr('data-original') ?? '';
    const desc = $('.ttmtiart').text().trim();

    const iframeUrl = $('iframe.viframe').attr('src') ?? '';
    const realUrl = iframeUrl.includes('url=') ? decodeURIComponent(iframeUrl.split('url=')[1]) : '';
    const simulatedPlayUrl = iframeUrl;

    const playlist: IPlaylist[] = [{
      title: '播放选项',
      videos: [
        { text: '🔗 原网页播放', url },
        { text: '▶️ 模拟官网播放', url: simulatedPlayUrl },
        { text: '🎞️ 真实链接（可能受限）', url: realUrl },
      ],
    }];

    return { id, title, cover, desc, remark: '', playlist };
  }
}
