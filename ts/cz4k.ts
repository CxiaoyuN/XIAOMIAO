export default class Cz4kSource implements Handle {
  getConfig() {
    return {
      id: 'cz4k',
      name: '厂长资源',
      api: 'https://www.cz4k.com',
      type: 1,
      nsfw: false,
    };
  }

  async getCategory() {
    return [
      { text: '最新电影', id: 'zuixindianying' },
      { text: '剧场版', id: 'dongmanjuchangban' },
      { text: '国产剧', id: 'gcj' },
      { text: '美剧', id: 'meijutt' },
      { text: '韩剧', id: 'hanjutv' },
      { text: '番剧', id: 'fanju' },
    ];
  }

  async getHome() {
    const cate = env.get('category') || 'zuixindianying';
    const page = env.get('page') || 1;
    const url = `${env.baseUrl}/${cate}/page/${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $('ul > li').toArray().map(item => {
      const el = $(item);
      const id = el.find('a').attr('href') ?? '';
      const title = el.find('h3.dytit a').text().trim();
      let cover = el.find('img').attr('data-original') ?? '';
      if (cover.startsWith('//')) cover = 'https:' + cover;
      const desc = el.find('p.inzhuy').text().replace('主演：', '').trim();
      const remark = el.find('.hdinfo span').text().trim();

      return {
        id,
        title,
        cover,
        desc,
        remark,
        playlist: [],
      };
    });
  }

  async getDetail() {
    const id = env.get('movieId');
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const title = $('.jujiinfo h3').text().trim();
    const cover = $('meta[property="og:image"]').attr('content') ?? '';
    const desc = $('.ttmtiart').text().replace(/\s+/g, ' ').trim();
    const remark = $('.ptit span').text().trim();
    const iframe = $('iframe.viframe').attr('src') ?? '';

    const playlist = [{
      title: '选集',
      videos: [{
        text: '播放',
        url: iframe,
      }],
    }];

    return { id, title, cover, desc, remark, playlist };
  }

  async getSearch() {
    const keyword = env.get('keyword');
    const page = env.get('page') || 1;
    const url = `${env.baseUrl}/xsss1O1?q=${encodeURIComponent(keyword)}&page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $('ul > li').toArray().map(item => {
      const el = $(item);
      const id = el.find('a').attr('href') ?? '';
      const title = el.find('h3.dytit a').text().trim();
      let cover = el.find('img').attr('data-original') ?? '';
      if (cover.startsWith('//')) cover = 'https:' + cover;
      const desc = el.find('p.inzhuy').text().replace('主演：', '').trim();
      const remark = el.find('.hdinfo span').text().trim();

      return {
        id,
        title,
        cover,
        desc,
        remark,
        playlist: [],
      };
    });
  }

  async parseIframe() {
    try {
      const result = await kitty.utils.getM3u8WithIframe(env);
      if (result && result.url) return result;
    } catch (e) {
      console.log('自动解析失败，尝试手动处理');
    }

    const iframeUrl = env.get('iframe');
    const html = await req(iframeUrl, {
      headers: {
        Referer: env.baseUrl,
      },
    });

    const m3u8Match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/);
    if (m3u8Match) {
      return {
        type: 'hls',
        url: m3u8Match[1],
      };
    }

    return {
      type: 'iframe',
      url: iframeUrl,
      headers: {
        Referer: env.baseUrl,
      },
    };
  }
}
