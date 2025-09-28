export default class SakuraAnime implements Handle {
  getConfig() {
    return {
      id: 'sakura295yhw',
      name: '樱花动漫',
      api: 'https://www.295yhw.com',
      type: 1, // 保持原来的 JS 模式
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
    const remark = $('.hl-item-sub').text().trim();
    const desc = $('.hl-item-text').text().trim();
    const playlist: Playlist[] = [];

    $('.hl-plays-list').each((_, el) => {
      const name = $(el).find('.hl-plays-title').text().trim();
      const urls = $(el).find('a').toArray().map(a => {
        const url = $(a).attr('href') ?? '';
        const title = $(a).text().trim();
        return { title, url };
      });
      playlist.push({ name, urls });
    });

    return { id, title, cover, desc, remark, playlist };
  }

  async parsePlayUrl() {
    const playUrl = env.get('playUrl');
    const html = await req(`${env.baseUrl}${playUrl}`);
    const $ = kitty.load(html);

    // 尝试从 player_aaaa 加密变量中提取播放地址
    const scriptText = $('script').toArray().map(s => $(s).html()).join('\n');
    const encryptedMatch = scriptText.match(/player_aaaa\s*=\s*{[^}]*"url"\s*:\s*"([^"]+)"[^}]*}/);
    if (encryptedMatch) {
      const encoded = decodeURIComponent(encryptedMatch[1]);
      const decoded = kitty.utils.base64Decode(encoded);
      if (decoded.includes('.m3u8')) {
        return { url: decoded };
      }
    }

    // 如果没有加密变量，尝试从 iframe 提取
    const iframeSrc = $('iframe').attr('src');
    if (iframeSrc) {
      return kitty.utils.getM3u8WithIframe({ iframe: iframeSrc });
    }

    return { url: '' };
  }
}
