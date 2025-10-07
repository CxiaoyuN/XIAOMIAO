export default class OmofunSource implements Handle {
  getConfig(): IConfig {
    return {
      id: 'omofun',
      name: 'Omofun动漫',
      type: 1,
      api: 'https://omofun.link',
      nsfw: false
    };
  }

  async getCategory(): Promise<ICategory[]> {
    return [
      { text: '电影', id: '1' },
      { text: '连续剧', id: '2' },
      { text: '综艺', id: '3' },
      { text: '动漫', id: '4' },
      { text: '里番绅士专区', id: '5' } // ✅ 仅分类页展示
    ];
  }

  async getHome(): Promise<IMovie[]> {
    const html = await req(`${env.baseUrl}/`);
    const $ = kitty.load(html);
    return $('.module-poster-item').toArray().map<IMovie>(el => {
      const a = $(el).find('a');
      const img = $(el).find('img');
      const id = a.attr('href') ?? '';
      const title = img.attr('alt') ?? '';
      let cover = img.attr('data-src') ?? '';
      if (cover.startsWith('//')) cover = 'https:' + cover;
      return {
        id,
        title,
        cover,
        desc: '',
        remark: $(el).find('.module-item-note').text() ?? '',
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
      const a = $(el).find('a');
      const img = $(el).find('img');
      const id = a.attr('href') ?? '';
      const title = img.attr('alt') ?? '';
      let cover = img.attr('data-src') ?? '';
      if (cover.startsWith('//')) cover = 'https:' + cover;
      return {
        id,
        title,
        cover,
        desc: '',
        remark: $(el).find('.module-item-note').text() ?? '',
        playlist: []
      };
    });
  }

  async getDetail(): Promise<IMovie> {
    const id = env.get('movieId');
    const html = await req(`${env.baseUrl}${id}`);
    const $ = kitty.load(html);
    const title = $('.module-info-heading h1').text();
    const cover = $('.module-info-poster img').attr('data-src') ?? '';
    const remark = $('.module-info-tag').text();
    const desc = $('.module-info-introduction-content').text();

    const playlist: IPlaylist[] = [];
    $('.module-play-list').each((_, el) => {
      const sourceTitle = $(el).find('.module-play-list-title').text();
      const videos: IPlaylistVideo[] = $(el).find('a').toArray().map<IPlaylistVideo>(a => {
        const text = $(a).text();
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
    const iframePage = env.get<string>('iframe');
    const html = await req(iframePage);
    const match = html.match(/"url":"(https:[^"]+\.m3u8)"/);
    if (match) {
      return match[1].replace(/\\\//g, '/'); // ✅ 解码真实地址
    }
    throw new Error('未找到真实播放地址');
  }
}
