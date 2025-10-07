export default class OmofunSource implements Handle {
  getConfig(): IConfig {
    return {
      id: 'omofun',
      name: 'Omofun,
      type: 1,
      api: 'https://omofun.link',
      nsfw: true
    };
  }

  async getCategory(): Promise<ICategory[]> {
    return [
      { text: '动漫', id: '4' },
      { text: '里番', id: '5' }
    ];
  }

  async getCategoryDetail(): Promise<IMovie[]> {
    const id = env.get('category');
    const page = env.get('page');
    const html = await req(`${env.baseUrl}/vod/show/id/${id}/page/${page}.html`);
    const $ = kitty.load(html);
    return $('.module-poster-item').toArray().map<IMovie>(el => {
      const a = $(el).attr('href') ?? $(el).find('a').attr('href') ?? '';
      const title = $(el).attr('title') ?? $(el).find('.module-poster-item-title').text().trim();
      let cover = $(el).find('img').attr('data-original') ?? '';
      if (cover.startsWith('//')) cover = 'https:' + cover;
      return {
        id: a,
        title,
        cover,
        desc: '',
        remark: $(el).find('.module-item-note').text().trim(),
        playlist: []
      };
    });
  }

  async getSearch(): Promise<IMovie[]> {
    const keyword = env.get('keyword');
    const page = env.get('page');
    const html = await req(`${env.baseUrl}/vod/search/page/${page}/wd/${keyword}.html`);
    const $ = kitty.load(html);
    return $('.module-poster-item').toArray().map<IMovie>(el => {
      const a = $(el).attr('href') ?? $(el).find('a').attr('href') ?? '';
      const title = $(el).attr('title') ?? $(el).find('.module-poster-item-title').text().trim();
      let cover = $(el).find('img').attr('data-original') ?? '';
      if (cover.startsWith('//')) cover = 'https:' + cover;
      return {
        id: a,
        title,
        cover,
        desc: '',
        remark: $(el).find('.module-item-note').text().trim(),
        playlist: []
      };
    });
  }

  async getDetail(): Promise<IMovie> {
    const id = env.get('movieId');
    const html = await req(`${env.baseUrl}${id}`);
    const $ = kitty.load(html);
    const title = $('.module-info-heading h1').text().trim();
    const cover = $('.module-info-poster img').attr('data-original') ?? '';
    const remark = $('.module-info-tag').text().trim();
    const desc = $('.module-info-introduction-content').text().trim();

    const playlist: IPlaylist[] = [];
    $('.module-play-list').each((_, el) => {
      const sourceTitle = $(el).find('.module-play-list-title').text().trim();
      const videos: IPlaylistVideo[] = $(el).find('a').toArray().map<IPlaylistVideo>(a => {
        const text = $(a).text().trim();
        const href = $(a).attr('href') ?? '';
        return {
          text,
          id: href
        };
      });
      playlist.push({ title: sourceTitle, videos });
    });

    return { id, title, cover, remark, desc, playlist };
  }

  async parseIframe(): Promise<string> {
    const iframeUrl = env.get<string>('iframe');
    const html = await req(iframeUrl);
    const match = html.match(/"url":"(https:[^"]+\.m3u8)"/);
    if (match) {
      return match[1].replace(/\\\//g, '/'); // ✅ 解码 JSON 中的转义字符
    }
    throw new Error('未找到真实播放地址');
  }
}
