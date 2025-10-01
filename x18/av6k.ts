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
      { text: '最新影片', id: '最新影片' },
      { text: '日韓無碼', id: '日韓無碼' },
      { text: '國產AV', id: '國產AV' },
      { text: '自拍偷拍', id: '自拍偷拍' },
    ];
  }

  async getHome() {
    const cate = env.get<string>('category');
    const page = env.get('page');
    const url = `${env.baseUrl}/sp/index.php/vod/search/page/${page}/wd/${cate}.html`;
    const $ = kitty.load(await req(url));
    return $('.stui-vodlist li').toArray().map(item => {
      const a = $(item).find('a');
      const title = a.attr('title') ?? '';
      const cover = a.attr('data-original') ?? '';
      const id = a.attr('href') ?? '';
      const remark = a.find('.pic-text.text-right').text().trim();
      return { title, cover, id, remark };
    });
  }

  async getDetail() {
    const id = env.get<string>('movieId');
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);
    const m3u8 = kitty.utils.getM3u8WithStr(html);
    const title = $('h1.title').text();
    return <IMovie>{
      title,
      playlist: [{ title: '默认', videos: [{ text: '播放', url: m3u8 }] }],
    };
  }

  async getSearch() {
    const wd = env.get<string>('keyword');
    const page = env.get('page');
    const url = `${env.baseUrl}/sp/index.php/vod/search/page/${page}/wd/${wd}.html`;
    const $ = kitty.load(await req(url));
    return $('.stui-vodlist li').toArray().map(item => {
      const a = $(item).find('a');
      const title = a.attr('title') ?? '';
      const cover = a.attr('data-original') ?? '';
      const id = a.attr('href') ?? '';
      const remark = a.find('.pic-text.text-right').text().trim();
      return { title, cover, id, remark };
    });
  }
}
