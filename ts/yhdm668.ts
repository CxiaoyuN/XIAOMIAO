// import { kitty, req, createTestEnv } from 'utils'

export default class yhdm668 implements Handle {
  private env = createTestEnv(this.getConfig().api);

  getConfig() {
    return <Iconfig>{
      id: 'yhdm668',
      name: '樱花动漫',
      api: 'https://www.yhdm668.com',
      nsfw: false,
      type: 1
    };
  }

  async getCategory() {
    try {
      const html = await req(`${this.env.baseUrl}/`);
      const $ = kitty.load(html);

      return $('.navbar-item').toArray().map(item => {
        const a = $(item).find('a');
        return <ICategory>{
          text: a.find('span').text().trim(),
          id: a.attr('href') ?? '',
          cover: a.find('img').attr('data-original') || ''
        };
      }).filter(c => c.id?.includes('/index.php/vod/type/'));
    } catch (error) {
      console.error('获取分类失败:', error);
      return [];
    }
  }

  async getHome() {
    const cate = this.env.get('category');
    const page = this.env.get('page') || 1;
    const hasQuery = cate.includes('?') || cate.includes('&');
    const url = `${this.env.baseUrl}${cate}${hasQuery ? '&' : '?'}page=${page}`;

    try {
      const html = await req(url);
      const $ = kitty.load(html);

      return $('.module-poster-item.module-item').toArray().map(item => {
        const a = $(item);
        return <IMovie>{
          id: a.attr('href') ?? '',
          title: a.attr('title') || a.find('.module-poster-item-title').text().trim(),
          cover: a.find('img').attr('data-original') || a.find('img').attr('src') || '',
          remark: a.find('.module-item-note').text().trim() || ''
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

      const title = $('.module-info-heading h1').text().trim();
      const cover = $('.module-info-poster img').attr('data-original') || $('.module-info-poster img').attr('src') || '';
      const desc = $('.module-info-introduction-content').text().trim();

      const tabs = $('.module-tab-item').toArray().map(item => $(item).text().trim());
      const _videos = $('.module-play-list').toArray().map<IPlaylistVideo[]>((item) =>
        $(item).find('a').toArray().map(a => ({
          id: $(a).attr('href') ?? '',
          text: $(a).text().trim()
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

      return $('.module-search-item').toArray().map<IMovie>(item => {
        const a = $(item).find('a');
        return {
          id: a.attr('href') ?? '',
          cover: a.find('img').attr('data-original') || a.find('img').attr('src') || '',
          title: a.attr('title') || a.find('.video-name').text().trim() || a.text().trim(),
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

      const m3u8 = kitty.utils.getM3u8WithIframe(this.env, html);
      if (m3u8) return m3u8;

      const $ = kitty.load(html);
      const script = $("script").toArray().find(item => {
        const text = $(item).text().trim();
        return text.includes('.m3u8') || text.includes('player_aaaa');
      });

      if (!script) throw new Error('未找到播放配置脚本');

      const scriptContent = $(script).text().trim();
      const match = scriptContent.match(/\"url\"\s*:\s*\"(.*?\.m3u8.*?)\"/);
      if (match && match[1]) return match[1].replace(/\\/g, '');

      throw new Error('未找到有效的播放地址');
    } catch (error) {
      console.error('解析播放地址失败:', error);
      return '';
    }
  }
}
