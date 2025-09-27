// import { kitty, req, createTestEnv } from 'utils'

export default class libvio implements Handle {
  private env = createTestEnv(this.getConfig().api);

  getConfig(): Iconfig {
    return {
      id: 'libvio',
      name: 'LIBVIO',
      api: 'https://www.libvio.cc',
      nsfw: false,
      type: 1,
    };
  }

  async getCategory(): Promise<ICategory[]> {
    return [
      { text: '电影', id: '1' },
      { text: '剧集', id: '2' },
      { text: '动漫', id: '4' },
      { text: '韩剧', id: '15' },
      { text: '美剧', id: '16' },
    ];
  }

  async getHome(): Promise<IMovie[]> {
    const cate = this.env.get('category');
    const page = this.env.get('page') || 1;
    const url = `${this.env.baseUrl}/type/${cate}.html?page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $('.stui-vodlist__box').toArray().map<IMovie>(item => {
      const a = $(item).find('a.stui-vodlist__thumb');
      return {
        id: a.attr('href') ?? '',
        title: a.attr('title') ?? '',
        cover: a.attr('data-original') ?? '',
        desc: '',
        remark: a.find('.pic-text.text-right').text() ?? '',
        playlist: [],
      };
    });
  }

  async getDetail(): Promise<IMovie> {
    const id = this.env.get('movieId');
    const url = `${this.env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const a = $('.stui-pannel-box .stui-vodlist__thumb.picture.v-thumb');
    const title = a.attr('title') ?? '';
    const cover = a.find('img').attr('data-original') ?? '';
    const desc = $('.detail.col-pd').text().trim() ?? '';

    const tabs = $('.nav.nav-tabs li').toArray().map(tab => $(tab).text().trim());
    const panes = $('.stui-panel_bd .tab-pane').toArray();

    const playlist: IPlaylist[] = tabs.map((title, i) => {
      const videos = $(panes[i]).find('a').toArray().map<IPlaylistVideo>(el => {
        const href = $(el).attr('href') ?? '';
        return {
          text: $(el).text().trim(),
          id: href,
        };
      });
      return { title, videos };
    });

    return { id, title, cover, desc, remark: '', playlist };
  }

  async getSearch(): Promise<IMovie[]> {
    const page = this.env.get('page') || '1';
    const wd = this.env.get('keyword');
    const url = `${this.env.baseUrl}/vodsearch/${wd}----------${page}---.html`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $('.stui-vodlist__media li').toArray().map<IMovie>(item => {
      const a = $(item).find('.v-thumb.stui-vodlist__thumb');
      return {
        id: a.attr('href') ?? '',
        title: a.attr('title') ?? '',
        cover: a.attr('data-original') ?? '',
        desc: '',
        remark: a.find('.pic-text.text-right').text() ?? '',
        playlist: [],
      };
    });
  }

  async parseIframe(): Promise<string> {
    const iframe = this.env.get('iframe');
    const playUrl = `${this.env.baseUrl}${iframe}`;
    const html = await req(playUrl);
    const $ = kitty.load(html);

    const playerScriptSrc = $("script[src*='player.js']").attr('src');
    if (playerScriptSrc) {
      const fullUrl = playerScriptSrc.startsWith('http')
        ? playerScriptSrc
        : `${this.env.baseUrl}${playerScriptSrc.startsWith('/') ? '' : '/'}${playerScriptSrc}`;
      const js = await req(fullUrl);
      const match = js.match(/["'](https?:\/\/[^"']+\.m3u8)["']/i);
      if (match) return match[1];
    }

    const inlineScript = $('script').toArray().find(s => $(s).text().includes('.m3u8'));
    if (inlineScript) {
      const text = $(inlineScript).text();
      const match = text.match(/["'](https?:\/\/[^"']+\.m3u8)["']/i);
      if (match) return match[1];
    }

    return '';
  }
}
