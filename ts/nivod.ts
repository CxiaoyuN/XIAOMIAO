export default class NivodSource implements Handle {
  getConfig() {
    return {
      id: 'nivod',
      name: '泥视频',
      api: 'https://www.nivod.vip',
      type: 1,
      nsfw: false
    };
  }

  async getCategory() {
    return [
      { id: '1', text: '电影' },
      { id: '2', text: '剧集' },
      { id: '3', text: '综艺' },
      { id: '4', text: '动漫' }
    ];
  }

  async getHome() {
    const cate = env.get('category') || '1';
    const page = env.get('page') || '1';
    const url = `https://www.nivod.vip/k/${cate}--------${page}---/`;
    const html = await req(url);
    const $ = kitty.load(html);
    const items = $('.module-item').toArray().map(item => {
      const a = $(item).find('a');
      const img = $(item).find('img');
      const id = a.attr('href') ?? '';
      const title = img.attr('alt') ?? '';
      let rawCover = img.attr('data-original') ?? img.attr('src') ?? '';
      let cover = rawCover.startsWith('/')
        ? `https://www.nivod.vip${rawCover}`
        : rawCover;
      const remark = $(item).find('.module-item-note').text().trim();
      return { id, title, cover, desc: '', remark, playlist: [] };
    });
    return items;
  }

  async getSearch() {
    const wd = env.get('keyword');
    const page = env.get('page') || '1';
    const url = `https://www.nivod.vip/s/${encodeURIComponent(wd)}-------------/page/${page}/`;
    const html = await req(url);
    const $ = kitty.load(html);
    const items = $('.module-item').toArray().map(item => {
      const a = $(item).find('a');
      const img = $(item).find('img');
      const id = a.attr('href') ?? '';
      const title = img.attr('alt') ?? '';
      let rawCover = img.attr('data-original') ?? img.attr('src') ?? '';
      let cover = rawCover.startsWith('/')
        ? `https://www.nivod.vip${rawCover}`
        : rawCover;
      const remark = $(item).find('.module-item-note').text().trim();
      return { id, title, cover, desc: '', remark, playlist: [] };
    });
    return items;
  }

  async getDetail() {
    const id = env.get('movieId');
    const url = `https://www.nivod.vip${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const title = $('.module-info-heading > h1').text().trim();
    let rawCover = $('.module-info-poster img').attr('data-original') ?? '';
    const cover = rawCover.startsWith('/')
      ? `https://www.nivod.vip${rawCover}`
      : rawCover;

    const intro = $('.module-info-introduction-content').text().trim();

    const getTextList = (label: string) =>
      $(`.module-info-item:contains("${label}")`)
        .find('a')
        .toArray()
        .map(a => $(a).text().trim())
        .filter(Boolean)
        .join(' / ');

    const getSingleText = (label: string) =>
      $(`.module-info-item:contains("${label}") .module-info-item-content`).text().trim();

    const director = getTextList('导演');
    const writer = getTextList('编剧');
    const actor = getTextList('主演');
    const duration = getSingleText('片长');
    const language = getSingleText('语言');
    const release = getSingleText('上映');
    const update = getSingleText('更新');
    const episode = getSingleText('集数');

    const desc = [
      intro,
      director && `导演：${director}`,
      writer && `编剧：${writer}`,
      actor && `主演：${actor}`,
      duration && `片长：${duration}`,
      language && `语言：${language}`,
      release && `上映：${release}`
    ]
      .filter(Boolean)
      .join('\n');

    const remark = `${episode} · ${update}`;

    const playlist: Playlist[] = [];
    $('.module-play-list').each((i, el) => {
      const sourceName = $(el).find('.module-play-list-name').text().trim() || `线路${i + 1}`;
      const videos: Video[] = [];
      $(el).find('a').each((j, a) => {
        const href = $(a).attr('href') ?? '';
        const name = $(a).text().trim();
        if (href) videos.push({ name, url: href });
      });
      if (videos.length) playlist.push({ name: sourceName, videos });
    });

    return { id, title, cover, desc, remark, playlist };
  }

  async parseIframe() {
    return await kitty.utils.getM3u8WithIframe(env);
  }
}
