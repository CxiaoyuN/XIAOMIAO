export default class ZZ1100 implements Handle {
  getConfig() {
    return {
      id: 'zz1100',
      name: 'ZZ100',
      api: 'https://www.zz1100.com',
      nsfw: true,
      type: 1
    };
  }

  async getCategory() {
    const html = await req(`${env.baseUrl}/home.htm`);
    const $ = kitty.load(html);
    const result: { text: string; id: string }[] = [];

    $('dl dd a').each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href') ?? '';
      if (href) result.push({ text, id: href });
    });

    return result.length > 0 ? result : [];
  }

  async getList() {
    const page = env.get('page') ?? '1';
    const id = env.get('id');
    const html = await req(`${env.baseUrl}${id.replace(/\d+\.htm$/, `${page}.htm`)}`);
    const $ = kitty.load(html);

    const result = $('.video-listing').toArray().map(item => {
      const a = $(item).find('a').first();
      const href = a.attr('href') ?? '';
      const id = href;

      const script = $(item).find('.av_data_title script').html();
      const titleMatch = script?.match(/decodeURIComponent\("(.+?)"\)/);
      const title = titleMatch ? decodeURIComponent(titleMatch[1].replace(/\+/g, ' ')) : '未知标题';

      const img = $(item).find('img');
      let cover = img.attr('data-src') ?? '';
      if (!cover || cover === '') cover = img.attr('src') ?? '';
      if (cover.startsWith('//')) cover = `https:${cover}`;
      if (!cover.startsWith('http')) cover = `${env.baseUrl}${cover}`;

      const remark = $(item).find('.ico-time').text().trim();
      return { id, title, cover, desc: '', remark, playlist: [] };
    });

    return result.length > 0 ? result : [];
  }

  async getDetail() {
    const id = env.get('movieId');
    const html = await req(`${env.baseUrl}${id}`);
    const titleMatch = html.match(/document\.title=decodeURIComponent\("(.+?)"\)/);
    const title = titleMatch ? decodeURIComponent(titleMatch[1].replace(/\+/g, ' ')) : '';

    const match = html.match(/setm3u8\('([^']+)'[\s,]*'([^']+)'\)/);
    const urls = match ? match.slice(1, 3) : [];

    const playlist = [{
      title: '清晰度选择',
      videos: urls.map((u, i) => ({
        text: i === 0 ? '550k' : '1M',
        url: `https://www.zz1100.com/m3u8/${u}`,
        type: 'm3u8'
      }))
    }];

    return {
      id,
      title,
      cover: '',
      desc: '',
      remark: '',
      playlist
    };
  }

  async getSearch() {
    const wd = env.get('keyword');
    const page = env.get('page') ?? '1';
    const html = await req(`${env.baseUrl}/search?wd=${wd}&page=${page}`);
    const $ = kitty.load(html);

    const result = $('.video-listing').toArray().map(item => {
      const a = $(item).find('a').first();
      const href = a.attr('href') ?? '';
      const id = href;

      const script = $(item).find('.av_data_title script').html();
      const titleMatch = script?.match(/decodeURIComponent\("(.+?)"\)/);
      const title = titleMatch ? decodeURIComponent(titleMatch[1].replace(/\+/g, ' ')) : '未知标题';

      const img = $(item).find('img');
      let cover = img.attr('data-src') ?? '';
      if (!cover || cover === '') cover = img.attr('src') ?? '';
      if (cover.startsWith('//')) cover = `https:${cover}`;
      if (!cover.startsWith('http')) cover = `${env.baseUrl}${cover}`;

      const remark = $(item).find('.ico-time').text().trim();
      return { id, title, cover, desc: '', remark, playlist: [] };
    });

    return result.length > 0 ? result : [];
  }

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env);
  }
}
