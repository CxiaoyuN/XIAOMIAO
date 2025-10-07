export default class OmofunSource implements Handle {
  getConfig() {
    return {
      id: 'omofun',
      name: 'Omofun动漫',
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

    const title = $('h1').text().trim();
    const cover = $('.module-info-poster img').attr('data-original') ?? '';
    const desc = $('.module-info-introduction-content p').text().trim();
    const remark = $('.module-info-tag-link').eq(0).text().trim();

    const playlist: Playlist[] = [];

    const tabItems = $('.module-tab-item.tab-item');
    const playContents = $('.module-play-list-content');

    if (tabItems.length > 0 && tabItems.length === playContents.length) {
      tabItems.each((i, el) => {
        let lineName = $(el).text().trim();
        if (!lineName || lineName === '默认') {
          lineName = `线路${i + 1}`;
        }

        const urls: PlayUrl[] = [];
        playContents.eq(i).find('a.module-play-list-link').each((_, a) => {
          const $a = $(a);
          const name = $a.find('span').text().trim();
          let url = $a.attr('href') ?? '';
          if (url.startsWith('/')) {
            url = `${env.baseUrl}${url}`;
          }
          urls.push({ name, url });
        });

        if (urls.length > 0) {
          playlist.push({ name: lineName, urls });
        }
      });
    } else {
      // fallback：无线路标签时直接遍历所有播放块
      playContents.each((i, el) => {
        const lineName = `线路${i + 1}`;
        const urls: PlayUrl[] = [];

        $(el).find('a.module-play-list-link').each((_, a) => {
          const $a = $(a);
          const name = $a.find('span').text().trim();
          let url = $a.attr('href') ?? '';
          if (url.startsWith('/')) {
            url = `${env.baseUrl}${url}`;
          }
          urls.push({ name, url });
        });

        if (urls.length > 0) {
          playlist.push({ name: lineName, urls });
        }
      });
    }

    return {
      id,
      title,
      cover,
      desc,
      remark,
      playlist,
    };
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const page = env.get('page');
    const url = `${env.baseUrl}/vod/search/page/${page}--.html?wd=${keyword}`;
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

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env);
  }
}
