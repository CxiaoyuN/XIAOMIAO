export default class NivodSource implements Handle {
  getConfig() {
    return {
      id: 'nivodtv',
      name: '泥视频TV',
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
    return $('.module-item').toArray().map(item => {
      const a = $(item).find('a');
      const img = $(item).find('img');
      const id = a.attr('href') ?? '';
      const title = img.attr('alt') ?? '';
      let rawCover = img.attr('data-original') ?? img.attr('src') ?? '';
      const cover = rawCover.startsWith('/')
        ? `https://www.nivod.vip${rawCover}`
        : rawCover;
      const remark = $(item).find('.module-item-note').text().trim();
      return { id, title, cover, desc: '', remark, playlist: [] };
    });
  }

  async getSearch() {
    const wd = env.get('keyword');
    const page = env.get('page') || '1';
    const url = `https://www.nivod.vip/s/${encodeURIComponent(wd)}-------------/page/${page}/`;
    const html = await req(url);
    const $ = kitty.load(html);
    return $('.module-item').toArray().map(item => {
      const a = $(item).find('a');
      const img = $(item).find('img');
      const id = a.attr('href') ?? '';
      const title = img.attr('alt') ?? '';
      let rawCover = img.attr('data-original') ?? img.attr('src') ?? '';
      const cover = rawCover.startsWith('/')
        ? `https://www.nivod.vip${rawCover}`
        : rawCover;
      const remark = $(item).find('.module-item-note').text().trim();
      return { id, title, cover, desc: '', remark, playlist: [] };
    });
  }

  async getDetail() {
    const id = env.get('movieId');
    const url = `https://www.nivod.vip${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const title = $('.module-info-heading > h1').text().trim() || '未知标题';
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
      .join('\n') || '暂无简介';

    const update = getSingleText('更新');
    const episode = getSingleText('集数');
    const remark = `${episode} · ${update}`;

    const playlist: Playlist[] = [];
    const tabNames = $('.module-tab-item').toArray().map(el => $(el).text().trim());

    $('.module-play-list').each((i, el) => {
      const sourceName = tabNames[i] || `线路${i + 1}`;
      const videos: Video[] = [];
      $(el).find('.module-play-list-link').each((j, a) => {
        const href = $(a).attr('href') ?? '';
        const text = $(a).attr('title')?.replace('播放', '').trim() || $(a).text().trim();
        if (href) videos.push({ name: text, url: href });
      });
      if (videos.length) playlist.push({ name: sourceName, videos });
    });

    // 如果没有播放列表，从 script 中兜底提取
    if (playlist.length === 0) {
      const scriptText = $('script')
        .toArray()
        .map(s => $(s).html())
        .find(t => t?.includes('var player_aaaa='));
      if (scriptText) {
        const match = scriptText.match(/var player_aaaa\s*=\s*(\{[\s\S]*?\});/);
        if (match) {
          try {
            const playerData = JSON.parse(match[1]);
            const playUrl = playerData.link ?? '';
            if (playUrl) {
              playlist.push({
                name: '正片',
                videos: [{ name: '播放', url: playUrl }]
              });
            }
          } catch (e) {
            console.log('player_aaaa 解析失败');
          }
        }
      }
    }

    return { id, title, cover, desc, remark, playlist };
  }

  async parseIframe() {
    return await kitty.utils.getM3u8WithIframe(env);
  }
}
