export default class ZZ1100 implements Handle {
  getConfig() {
    return {
      id: 'zz1100',
      name: '一千ZZ',
      api: 'https://www.zz1100.com',
      nsfw: true,
      type: 1
    };
  }

  async getCategory() {
    return [
      { text: '国产自拍', id: '/htms/list1/1.htm' },
      { text: '日韩精剪', id: '/htms/list50/1.htm' },
      { text: '家庭乱伦', id: '/htms/list4/1.htm' },
      { text: '少女萝莉', id: '/htms/list3/1.htm' },
      { text: '熟女少妇', id: '/htms/list5/1.htm' },
      { text: '偷拍窥摄', id: '/htms/list8/1.htm' },
      { text: '群交换妻', id: '/htms/list6/1.htm' },
      { text: '醉酒迷奸', id: '/htms/list37/1.htm' },
      { text: '欧美激情', id: '/htms/list19/1.htm' },
      { text: '网曝泄密', id: '/htms/list38/1.htm' },
      { text: '户外野战', id: '/htms/list36/1.htm' },
      { text: '直播裸聊', id: '/htms/list2/1.htm' },
      { text: '巨乳诱惑', id: '/htms/list41/1.htm' },
      { text: '后入交媾', id: '/htms/list40/1.htm' },
      { text: '猎奇视频', id: '/htms/list39/1.htm' },
      { text: '真实破处', id: '/htms/list43/1.htm' }
    ];
  }

  async getList() {
    const page = env.get('page') ?? '1';
    const id = env.get('id');
    const html = await req(`${env.baseUrl}${id.replace(/\\d+\\.htm$/, `${page}.htm`)}`);
    const $ = kitty.load(html);

    const result = $('.video-listing').toArray().map(item => {
      const a = $(item).find('a').first();
      const href = a.attr('href') ?? '';
      const id = href;
      const titleScript = $(item).find('.av_data_title script').html();
      const titleMatch = titleScript?.match(/decodeURIComponent\\("(.+?)"\\)/);
      const title = titleMatch ? decodeURIComponent(titleMatch[1].replace(/\\+/g, ' ')) : '';
      const img = $(item).find('img');
      let cover = img.attr('data-src') ?? '';
      if (cover.startsWith('//')) cover = `https:${cover}`;
      const remark = $(item).find('.ico-time').text().trim();
      return { id, title, cover, desc: '', remark, playlist: [] };
    });

    return result;
  }

  async getDetail() {
    const id = env.get('movieId');
    const html = await req(`${env.baseUrl}${id}`);
    const titleMatch = html.match(/document\\.title=decodeURIComponent\\("(.+?)"\\)/);
    const title = titleMatch ? decodeURIComponent(titleMatch[1].replace(/\\+/g, ' ')) : '';

    const match = html.match(/setm3u8\\('([^']+)'\\s*,\\s*'([^']+)'\\)/);
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
      const titleScript = $(item).find('.av_data_title script').html();
      const titleMatch = titleScript?.match(/decodeURIComponent\\("(.+?)"\\)/);
      const title = titleMatch ? decodeURIComponent(titleMatch[1].replace(/\\+/g, ' ')) : '';
      const img = $(item).find('img');
      let cover = img.attr('data-src') ?? '';
      if (cover.startsWith('//')) cover = `https:${cover}`;
      const remark = $(item).find('.ico-time').text().trim();
      return { id, title, cover, desc: '', remark, playlist: [] };
    });

    return result;
  }

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env);
  }
}
