import { kitty, req, createTestEnv } from 'utils'

export default class yhdm668 implements Handle {
  private env = createTestEnv(this.getConfig().api);

  getConfig() {
    return <Iconfig>{
      id: 'yhdm668',
      name: '樱花动漫',
      api: 'https://www.yhdm668.com',
      nsfw: false,
      type: 1
    }
  }

  async getCategory() {
    return <ICategory[]>[
      { text: '热门', id: '/index.php/label/hot.html' },
      { text: '今日', id: '/index.php/label/new.html' },
      { text: '周更', id: '/index.php/label/week.html' },
      { text: '最近', id: '/index.php/vod/show/id/4.html' },
      { text: '电影', id: '/index.php/vod/type/id/20.html' },
      { text: '连载', id: '/index.php/vod/type/id/4.html' },
      { text: '完结', id: '/index.php/vod/type/id/21.html' },
    ]
  }

  async getHome() {
    const cate = this.env.get('category');
    const page = this.env.get('page') || 1;
    const hasQuery = cate.includes('?') || cate.includes('&');
    const url = `${this.env.baseUrl}${cate}${hasQuery ? '&' : '?'}page=${page}`;

    try {
      const html = await req(url);
      const $ = kitty.load(html);
      return $('.module-items .module-item').toArray().map(item => {
        const a = $(item).find('a');
        return <IMovie>{
          id: a.attr('href') ?? '',
          title: a.attr('title') || a.find('.module-poster-item-title').text().trim() || '',
          cover: a.find('img').attr('data-original') || a.find('img').attr('src') || '',
          remark: $(item).find('.module-item-note').text().trim() || ''
        };
      });
    } catch (error) {
      console.error('获取首页内容失败:', error);
      return [];
    }
  }

  async getDetail() {
    const id = this.env.get('movieId');
    if (!id) throw new Error('电影ID不存在');

    try {
      const url = `${this.env.baseUrl}${id}`;
      const html = await req(url);
      const $ = kitty.load(html);

      const title = $('.module-info-heading h1').text().trim() || $('title').text().trim() || '';
      const cover = $('.module-info-poster img').attr('data-original') || $('.module-info-poster img').attr('src') || '';
      const desc = $('.module-info-introduction-content').text().trim() || '';

      const tabs = $('.module-tab-items-box .module-tab-item').toArray().map(item => $(item).text().trim());
      const _videos = $('.module-play-list').toArray().map<IPlaylistVideo[]>((item) =>
        $(item).find('a').toArray().map(a => ({
          id: $(a).attr('href') ?? '',
          text: $(a).text().trim() || ''
        }))
      );

      const playlist = tabs.map((tabTitle, index) => ({
        title: tabTitle,
        videos: _videos[index] || []
      }));

      return <IMovie>{ id, title, cover, desc, playlist };
    } catch (error) {
      console.error('获取详情失败:', error);
      return <IMovie>{ id, title: '', cover: '', desc: '', playlist: [] };
    }
  }

  async getSearch() {
    const keyword = this.env.get('keyword');
    const page = this.env.get('page') || 1;
    if (!keyword) throw new Error('搜索关键词不存在');

    try {
      const url = `${this.env.baseUrl}/index.php/vod/search/page/${page}/wd/${encodeURIComponent(keyword)}.html`;
      const html = await req(url);
      const $ = kitty.load(html);

      return $('.module-items .module-search-item').toArray().map<IMovie>(item => {
        const a = $(item).find('a');
        return {
          id: a.attr('href') ?? '',
          cover: a.find('img').attr('data-original') || a.find('img').attr('src') || '',
          title: a.attr('title') || a.text().trim() || '',
          remark: $(item).find('.video-remarks').text().trim() || ''
        };
      });
    } catch (error) {
      console.error('搜索失败:', error);
      return [];
    }
  }

  async parseIframe() {
    const iframePath = this.env.get<string>('iframe');
    if (!iframePath) throw new Error('播放地址不存在');

    try {
      const url = `${this.env.baseUrl}${iframePath}`;
      const html = await req(url);
      const $ = kitty.load(html);

      const script = $("script").toArray().find(item => {
        const text = $(item).text().trim();
        return /m3u8|player_config|video|src|url/.test(text);
      });

      if (!script) throw new Error('未找到播放配置脚本');

      const scriptContent = $(script).text().trim();
      const m3u8Match = scriptContent.match(/(?:url|src)\s*[:=]\s*["']([^"']*\.m3u8[^"']*)["']/i);

      if (m3u8Match && m3u8Match[1]) {
        let url = m3u8Match[1];

        if (url.includes('%')) {
          url = decodeURIComponent(url);
        }

        if (url.length > 100 || scriptContent.includes('base64')) {
          if (/^[A-Za-z0-9+/=]+$/.test(url)) {
            url = this.base64Decode(url);
          }
        }

        if (url.startsWith('//')) {
          url = `https:${url}`;
        } else if (!url.startsWith('http')) {
          url = `${this.env.baseUrl}${url}`;
        }

        return url;
      }

      throw new Error('未找到有效的m3u8播放地址');
    } catch (error) {
      console.error('解析播放地址失败:', error);
      return '';
    }
  }

  private base64Decode(input: string) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let str = input.replace(/[^A-Za-z0-9+/=]/g, '');
    let output = "";

    for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer &&
      (bs = bc % 4 ? bs * 64 + buffer : buffer,
        bc++ % 4) ? output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))) : 0) {
      buffer = chars.indexOf(buffer);
    }

    return output;
  }
}
