export default class AV6KSource implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'av6k',
      name: 'AV6K',
      api: 'https://av6k.com',
      nsfw: true,
      type: 1,
    };
  }

  async getCategory() {
    return <ICategory[]>[
      { id: '', text: '最新影片' },
      { id: 'rihanwuma', text: '日韓無碼' },
      { id: 'fc2', text: 'FC2無碼' },
      { id: 'rihanyouma', text: '日韓有碼' },
      { id: 'jxny', text: '中文字幕' },
      { id: 'chinese-av-porn', text: '國產AV' },
      { id: 'surenzipai', text: '自拍偷拍' },
      { id: 'oumeiwuma', text: '歐美無碼' },
      { id: 'chengrendongman', text: '成人動漫' },
    ];
  }

  async getHome() {
    const cate = env.get<string>('category') ?? '';
    const page = env.get<number>('page') ?? 1;
    const url = `${env.baseUrl}/${cate ? cate + '/' : ''}page/${page}.html`;
    const $ = kitty.load(await req(url));
    return $('.listA').toArray().map(item => {
      const a = $(item).find('a');
      const title = a.attr('title')?.trim() ?? '';
      const id = a.attr('href') ?? '';
      const img = a.find('img').attr('src') ?? '';
      const cover = img.startsWith('/') ? `${env.baseUrl}${img}` : img;
      const preview = a.find('video').attr('srcmv') ?? '';
      const remark = $(item).find('.video-views').text().trim();
      const date = $(item).find('.video-added').text().trim();
      return {
        title,
        id,
        cover,
        preview,
        remark: `${remark} · ${date}`,
      };
    });
  }

  async getDetail() {
    const id = env.get<string>('movieId');
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const m3u8Match = html.match(/var\s+sp_m3u8\s*=\s*"([^"]+)"/);
    const m3u8 = m3u8Match ? m3u8Match[1] : '';
    const $ = kitty.load(html);
    const title = $('title').text().trim();
    return <IMovie>{
      title,
      playlist: [
        {
          title: '播放',
          videos: [{ text: '立即播放', url: m3u8 }],
        },
      ],
    };
  }

  async getSearch() {
    const keyword = env.get<string>('keyword');
    const page = env.get<number>('page') ?? 1;
    const url = `${env.baseUrl}/search/${encodeURIComponent(keyword)}-${page}.html`;
    const $ = kitty.load(await req(url));
    return $('.listA').toArray().map(item => {
      const a = $(item).find('a');
      const title = a.attr('title')?.trim() ?? '';
      const id = a.attr('href') ?? '';
      const img = a.find('img').attr('src') ?? '';
      const cover = img.startsWith('/') ? `${env.baseUrl}${img}` : img;
      const preview = a.find('video').attr('srcmv') ?? '';
      const remark = $(item).find('.video-views').text().trim();
      const date = $(item).find('.video-added').text().trim();
      return {
        title,
        id,
        cover,
        preview,
        remark: `${remark} · ${date}`,
      };
    });
  }
}
