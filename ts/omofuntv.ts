export default class Omofun implements Handle {
  getConfig(): IConfig {
    return {
      id: 'omofuntv',
      name: 'Omofun',
      api: 'https://omofun.link',
      type: 1,
      nsfw: false
    };
  }

  async getCategory(): Promise<ICategory[]> {
    return [
      { text: '电影', id: '1' },
      { text: '剧集', id: '2' },
      { text: '综艺', id: '3' },
      { text: '动漫', id: '4' },
      { text: '里番', id: '5' }
    ];
  }

  async getCategoryDetail(): Promise<IMovie[]> {
    const id = env.get('category');
    const page = env.get('page');
    const html = await req(`${env.baseUrl}/vod/show/id/${id}/page/${page}.html`);
    const $ = kitty.load(html);

    return $('a.module-poster-item').toArray().map<IMovie>(el => {
      const a = $(el);
      const title = a.attr('title') ?? a.find('.module-poster-item-title').text().trim();
      let cover = a.find('img').attr('data-original') ?? '';
      if (cover.startsWith('//')) cover = 'https:' + cover;
      return {
        id: a.attr('href') ?? '',
        title,
        cover,
        desc: '',
        remark: a.find('.module-item-note').text().trim(),
        playlist: []
      };
    });
  }
}
