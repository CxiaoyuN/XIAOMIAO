export default class Cz4kSource implements Handle {
  getConfig() {
    return {
      id: 'cz4k',
      name: '厂长资源',
      api: 'https://www.cz4k.com',
      nsfw: false,
      type: 1,
    };
  }

  async getCategory() {
    return [
      { text: '电影', id: 'zuixindianying' },
      { text: '国剧', id: 'guochanju' },
      { text: '美剧', id: 'meiju' },
      { text: '韩剧', id: 'hanju' },
    ];
  }

  async getHome() {
    const cate = env.get('category');
    const page = env.get('page') || 1;
    const url = `${env.baseUrl}/${cate}?page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $('.movie-item').toArray().map(item => {
      const title = $(item).find('.title').text();
      const id = $(item).find('a').attr('href') ?? '';
      let cover = $(item).find('img').attr('data-src') ?? '';
      if (cover.startsWith('//')) cover = `https:${cover}`;
      return {
        id,
        title,
        cover,
        desc: '',
        remark: '',
        playlist: [],
      };
    });
  }

  async getDetail() {
    const id = env.get('movieId');
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const title = $('h1').text();
    const cover = $('img.cover').attr('src') ?? '';
    const remark = $('.score').text();
    const desc = $('.desc').text();

    const playlist = [{
      title: '默认',
      videos: [{
        text: '播放',
        url: $('iframe').attr('src'),
      }],
    }];

    return { id, title, cover, remark, desc, playlist };
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const page = env.get('page') || 1;
    const url = `${env.baseUrl}/search?wd=${encodeURIComponent(keyword)}&page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $('.movie-item').toArray().map(item => {
      const title = $(item).find('.title').text();
      const id = $(item).find('a').attr('href') ?? '';
      let cover = $(item).find('img').attr('data-src') ?? '';
      if (cover.startsWith('//')) cover = `https:${cover}`;
      return {
        id,
        title,
        cover,
        desc: '',
        remark: '',
        playlist: [],
      };
    });
  }

  async parseIframe() {
    const iframe = env.get('iframe');
    return kitty.utils.getM3u8WithIframe(env);
  }
}
