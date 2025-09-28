export default class YHW implements Handle {
  getConfig() {
    return {
      id: 'yhw',
      name: '樱花动漫',
      api: 'https://www.295yhw.com',
      type: 1,
      nsfw: false,
    };
  }

  async getHome() {
    const html = await reqBrowser(`${env.baseUrl}/`);
    const items = [...html.matchAll(/hl-item-thumb[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*data-original="([^"]+)"[\s\S]*?remarks">([^<]*)</g)].map(m => ({
      id: m[1],
      title: m[2],
      cover: m[3],
      remark: m[4].trim(),
      desc: '',
      playlist: [],
    }));
    return items;
  }

  async getCategory() {
    return [
      { text: '日本动漫', id: 'ribendongman' },
      { text: '国产动漫', id: 'guochandongman' },
      { text: '动漫电影', id: 'dongmandianying' },
      { text: '欧美动漫', id: 'omeidongman' },
    ];
  }

  async getCategoryDetail() {
    const cateId = env.get('cateId');
    const page = env.get('page');
    const html = await reqBrowser(`${env.baseUrl}/show/${cateId}--------${page}---.html`);
    const items = [...html.matchAll(/hl-item-thumb[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*data-original="([^"]+)"[\s\S]*?remarks">([^<]*)</g)].map(m => ({
      id: m[1],
      title: m[2],
      cover: m[3],
      remark: m[4].trim(),
      desc: '',
      playlist: [],
    }));
    return items;
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const html = await reqBrowser(`${env.baseUrl}/search/${encodeURIComponent(keyword)}-------------.html`);
    const items = [...html.matchAll(/hl-item-thumb[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*data-original="([^"]+)"[\s\S]*?remarks">([^<]*)</g)].map(m => ({
      id: m[1],
      title: m[2],
      cover: m[3],
      remark: m[4].trim(),
      desc: '',
      playlist: [],
    }));
    return items;
  }

  async getDetail() {
    const id = env.get('movieId');
    const html = await reqBrowser(`${env.baseUrl}${id}`);
    const title = html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]?.trim() ?? '';
    const cover = html.match(/hl-item-thumb[^>]*data-original="([^"]+)"/)?.[1] ?? '';
    const remark = html.match(/hl-item-sub[^>]*>([^<]+)<\/div>/)?.[1]?.trim() ?? '';
    const desc = html.match(/hl-item-text[^>]*>([^<]+)<\/div>/)?.[1]?.trim() ?? '';
    const playlist: Playlist[] = [];

    const blockMatch = [...html.matchAll(/hl-plays-list[\s\S]*?hl-plays-title[^>]*>([^<]+)<[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/g)];
    for (const [, name, ul] of blockMatch) {
      const urls = [...ul.matchAll(/href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].flatMap(m => [
        { title: `${m[2]}（直链）`, url: `${m[1]}?real=1` },
        { title: `${m[2]}（原页）`, url: `${m[1]}?raw=1` },
      ]);
      playlist.push({ name: name.trim(), urls });
    }

    return { id, title, cover, desc, remark, playlist };
  }

  async parsePlayUrl() {
    const playUrl = env.get('playUrl');
    const cleanUrl = playUrl.replace(/\?real=1|\?raw=1/, '');
    const html = await reqBrowser(`${env.baseUrl}${cleanUrl}`);

    if (playUrl.includes('?raw=1')) {
      return {
        url: `${env.baseUrl}${cleanUrl}`,
        headers: { Referer: env.baseUrl },
      };
    }

    const match = html.match(/player_aaaa\s*=\s*{[^}]*"url"\s*:\s*"([^"]+)"/);
    if (match) {
      const encoded = decodeURIComponent(match[1]);
      const decoded = kitty.utils.base64Decode(encoded);
      if (decoded.includes('.mp4') || decoded.includes('.m3u8')) {
        return { url: decoded };
      }
    }

    const iframe = html.match(/<iframe[^>]*src="([^"]+)"/)?.[1];
    if (iframe) {
      return kitty.utils.getM3u8WithIframe({ iframe });
    }

    return { url: '' };
  }
}
