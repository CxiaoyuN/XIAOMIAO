export default class SakuraAnime implements Handle {
  getConfig() {
    return {
      id: 'sakura295yhw',
      name: '樱花动漫',
      api: 'https://www.295yhw.com',
      type: 1, // 标准 JS 源
      nsfw: false,
    };
  }

  async getHome() {
    const html = await req(`${env.baseUrl}/`);
    const $ = kitty.load(html);
    const items = $('ul.hl-vod-list li').toArray().map(el => {
      const a = $(el).find('a.hl-item-thumb');
      const id = a.attr('href') ?? '';
      const title = a.attr('title') ?? '';
      const cover = a.attr('data-original') ?? '';
      const remark = $(el).find('.remarks').text().trim();
      return { id, title, cover, desc: '', remark, playlist: [] };
    });
    return items;
  }

  async getCategory() {
    return [
      { text: '日本动漫', id: 'ribendongman' },
      { text: '国产动漫', id: 'guochandongman' },
      { text: '欧美动漫', id: 'oumeidongman' },
    ];
  }

  async getCategoryDetail() {
    const cateId = env.get('cateId');
    const page = env.get('page');
    const url = `${env.baseUrl}/show/${cateId}--------${page}---.html`;
    const html = await req(url);
    const $ = kitty.load(html);
    const items = $('ul.hl-vod-list li').toArray().map(el => {
      const a = $(el).find('a.hl-item-thumb');
      const id = a.attr('href') ?? '';
      const title = a.attr('title') ?? '';
      const cover = a.attr('data-original') ?? '';
      const remark = $(el).find('.remarks').text().trim();
      return { id, title, cover, desc: '', remark, playlist: [] };
    });
    return items;
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const url = `${env.baseUrl}/search/${encodeURIComponent(keyword)}-------------.html`;
    const html = await req(url);
    const $ = kitty.load(html);
    const items = $('ul.hl-vod-list li').toArray().map(el => {
      const a = $(el).find('a.hl-item-thumb');
      const id = a.attr('href') ?? '';
      const title = a.attr('title') ?? '';
      const cover = a.attr('data-original') ?? '';
      const remark = $(el).find('.remarks').text().trim();
      return { id, title, cover, desc: '', remark, playlist: [] };
    });
    return items;
  }

  async getDetail() {
    const id = env.get('movieId');
    const html = await req(`${env.baseUrl}${id}`);
    const $ = kitty.load(html);
    const title = $('h1').text().trim();
    const cover = $('.hl-item-thumb').attr('data-original') ?? '';
    const remark = $('.hl-item-content .hl-item-sub').text().trim();
    const desc = $('.hl-item-content .hl-item-text').text().trim();
    const playlist: Playlist[] = [];

    $('.hl-plays-list').each((_, el) => {
      const name = $(el).find('.hl-plays-title').text().trim();
      const urls = $(el).find('a').toArray().map(a => ({
        title: $(a).text().trim(),
        url: $(a).attr('href') ?? '',
      }));
      playlist.push({ name, urls });
    });

    return { id, title, cover, desc, remark, playlist };
  }

  async parsePlayUrl() {
    const playUrl = env.get('playUrl');
    const html = await req(`${env.baseUrl}${playUrl}`);
    const iframeSrc = kitty.load(html)('iframe').attr('src');
    return kitty.utils.getM3u8WithIframe({ iframe: iframeSrc });
  }
}
