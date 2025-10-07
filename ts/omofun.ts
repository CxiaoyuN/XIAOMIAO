export default class OmofunSource implements Handle {
  getConfig() {
    return {
      id: 'omofun',
      name: 'Omofun',
      api: 'https://omofun.link',
      type: 1,
      nsfw: false,
    };
  }

  async getCategory() {
    return [
      { text: '动漫', id: '4' },
      { text: '里番', id: '5' },
    ];
  }

  async getHome() {
    const cate = env.get('category');
    const page = env.get('page');
    const url = `${env.baseUrl}/vod/show/id/${cate}/page/${page}.html`;
    const html = await req(url);
    const $ = kitty.load(html);

    const result = $('.module-poster-item').toArray().map(item => {
      const img = $(item).find('img.lazy');
      const id = $(item).attr('href') ?? '';
      const title = img.attr('alt') ?? '';
      let cover = img.attr('data-original') ?? '';
      if (cover.startsWith('//')) cover = 'https:' + cover;
      const remark = $(item).find('.module-item-note').text() ?? '';
      return { id, title, cover, desc: '', remark, playlist: [] };
    });

    return result;
  }

  async getDetail() {
    const id = env.get('movieId');
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    // TODO: 提取播放列表
    const playlist = [];

    return {
      id,
      title: $('title').text(),
      cover: '', // 可从页面中提取
      desc: '',  // 可从页面中提取
      remark: '',
      playlist,
    };
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const page = env.get('page');
    const url = `${env.baseUrl}/vod/search/page/${page}--.html?wd=${keyword}`;
    const html = await req(url);
    const $ = kitty.load(html);

    // TODO: 提取搜索结果
    return [];
  }

  async parseIframe() {
    const iframe = env.get('iframe');
    return kitty.utils.getM3u8WithIframe(env);
  }
}
