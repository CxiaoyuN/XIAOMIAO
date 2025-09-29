// import { kitty, req } from 'utils'

// 定义常量，避免魔法字符串，提高可维护性
const CONFIG = {
  BASE_URL: 'https://www.857yhw.com',
  SUPPORT_PAGING_CATEGORIES: ['ribendongman', 'guochandongman'] as const, // 明确为只读元组
  DEFAULT_CATEGORIES: [
    { text: '日漫', id: 'ribendongman' },
    { text: '国漫', id: 'guochandongman' },
    { text: '美漫', id: 'omeidongman' },
    { text: '动画', id: 'dongmandianying' },
  ] as const,
  SELECTORS: {
    VOD_LIST: '.myui-vodlist__box',
    THUMB_LINK: 'a.myui-vodlist__thumb',
    PIC_TEXT: '.pic-text',
    DETAIL_TITLE: '.myui-content__detail .title',
    DETAIL_DESC: '.myui-content__detail .data',
    DETAIL_COVER: '.myui-content__thumb .lazyload',
    DETAIL_REMARK: '.myui-content__detail .myui-content__other',
    PLAY_LIST: '#playlist .col-md-auto a',
  } as const,
  URL_TEMPLATES: {
    CATEGORY: (cate: string, page: string) => `/type/${cate}${page ? `-${page}` : ''}.html`,
    SEARCH: (wd: string, page: string) => `/search/${wd}----------${page}---.html`,
  } as const,
  REQUEST_RETRY_TIMES: 2, // 请求重试次数
  REQUEST_TIMEOUT: 10000, // 请求超时时间（毫秒）
} as const;

// 工具函数：带重试和超时的请求
async function robustReq(url: string, retries = CONFIG.REQUEST_RETRY_TIMES): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      // 假设 req 函数支持超时选项，如果不支持，需要实现或使用其他库
      return await req(url); // 这里需要根据实际的 req 函数调整，可能添加超时逻辑
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`请求失败 ${url}, 第 ${i + 1} 次重试...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 延迟重试
    }
  }
  throw new Error(`请求失败: ${url}`);
}

export default class YHW implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'yhw',
      name: '樱花动漫',
      api: CONFIG.BASE_URL,
      type: 1,
      nsfw: false,
    };
  }

  async getCategory() {
    // 返回副本，避免外部修改影响常量
    return [...CONFIG.DEFAULT_CATEGORIES];
  }

  // 提取公共的视频项解析逻辑
  private parseVideoItem(item: cheerio.Element, $: cheerio.CheerioAPI): IVideoItem {
    const $item = $(item);
    const $a = $item.find(CONFIG.SELECTORS.THUMB_LINK);
    
    const id = $a.attr('href') || '';
    // 尝试从alt属性或图片标题获取title，增强容错
    const title = $a.attr('title') || $a.attr('alt') || $a.find('img').attr('title') || '';
    // 优先获取data-original, 其次src
    const cover = $a.attr('data-original') || $a.find('img').attr('src') || '';
    const remark = ($item.find(CONFIG.SELECTORS.PIC_TEXT).text() || '').trim();

    // 基础验证
    if (!id || !title) {
      console.debug('解析到无效视频项:', { id, title });
    }

    return { id, title, cover, remark, playlist: [] };
  }

  async getHome() {
    const cate = env.get('category') || ''; // 提供默认值
    const page = env.get('page') || '1'; // 提供默认值

    try {
      const supportsPaging = (CONFIG.SUPPORT_PAGING_CATEGORIES as readonly string[]).includes(cate);
      const path = CONFIG.URL_TEMPLATES.CATEGORY(cate, supportsPaging ? page : '');
      const url = `${CONFIG.BASE_URL}${path}`;

      console.log(`Fetching home data from: ${url}`);
      const html = await robustReq(url);
      const $ = kitty.load(html);

      const items = $(CONFIG.SELECTORS.VOD_LIST)
        .toArray()
        .map(item => this.parseVideoItem(item, $))
        .filter(v => v.id && v.title); // 过滤掉无效项

      if (items.length > 0) {
        return items;
      } else {
        console.log('首页列表为空，尝试降级方案...');
        return await this.getFallbackHome();
      }
    } catch (error) {
      console.error('获取首页数据失败:', error);
      return await this.getFallbackHome(); // 失败时也降级
    }
  }

  async getFallbackHome() {
    try {
      console.log(`Fetching fallback data from: ${CONFIG.BASE_URL}/`);
      const html = await robustReq(`${CONFIG.BASE_URL}/`);
      const $ = kitty.load(html);

      return $(CONFIG.SELECTORS.VOD_LIST)
        .toArray()
        .map(item => this.parseVideoItem(item, $))
        .filter(v => v.id && v.title);
    } catch (error) {
      console.error('降级方案也失败了:', error);
      return []; // 避免上层崩溃，返回空数组
    }
  }

  async getDetail() {
    const id = env.get('movieId');
    if (!id) {
      console.error('movieId 为空');
      throw new Error('无效的 movieId');
    }

    const url = `${CONFIG.BASE_URL}${id}`;
    let html: string;
    let $: cheerio.CheerioAPI;

    try {
      console.log(`Fetching detail from: ${url}`);
      html = await robustReq(url);
      $ = kitty.load(html);
    } catch (error) {
      console.error(`请求详情页失败: ${url}`, error);
      throw new Error('获取详情失败，请检查网络或movieId');
    }

    // 使用更稳健的选择器，添加默认值
    const title = ($(CONFIG.SELECTORS.DETAIL_TITLE).text() || '未知标题').trim();
    const desc = ($(CONFIG.SELECTORS.DETAIL_DESC).text() || '').trim();
    const cover = $(CONFIG.SELECTORS.DETAIL_COVER).attr('data-original') || $(CONFIG.SELECTORS.DETAIL_COVER).attr('src') || '';
    const remark = ($(CONFIG.SELECTORS.DETAIL_REMARK).text() || '').trim();

    const rawLinks = $(CONFIG.SELECTORS.PLAY_LIST)
      .toArray()
      .map(item => {
        const $item = $(item);
        return {
          text: ($item.text() || '未知集数').trim(),
          playPath: $item.attr('href') || '',
        };
      })
      .filter(link => link.playPath); // 过滤掉没有播放路径的链接

    if (rawLinks.length === 0) {
      console.warn('未在详情页找到播放链接', url);
    }

    const videos: IPlaylistVideo[] = [];
    // 使用 for...of 以便在循环内使用 await
    for (const link of rawLinks) {
      try {
        const playUrl = `${CONFIG.BASE_URL}${link.playPath}`;
        console.log(`解析播放页: ${playUrl}`);
        const playHtml = await robustReq(playUrl);

        // 更健壮的正则匹配，允许空格和不同引号
        const urlMatch = playHtml.match(/player_data\s*\.\s*url\s*=\s*["']([^"']+)["']/);
        const encryptMatch = playHtml.match(/player_data\s*\.\s*encrypt\s*=\s*["']?(\d)["']?/);

        if (!urlMatch || !encryptMatch) {
          console.warn(`未在播放页找到 player_data 信息: ${playUrl}`);
          continue; // 跳过这个链接，继续下一个
        }

        let realUrl = urlMatch[1];
        const encryptType = encryptMatch[1];

        console.log(`解密前: ${realUrl}, 加密类型: ${encryptType}`);
        // 解密逻辑
        if (encryptType === '2') {
          realUrl = Buffer.from(decodeURIComponent(realUrl), 'base64').toString('utf-8');
        } else if (encryptType === '1') {
          realUrl = decodeURIComponent(realUrl);
        } else {
          console.warn(`未知的加密类型: ${encryptType}, 使用原始URL.`);
          // 保持 realUrl 不变
        }
        console.log(`解密后: ${realUrl}`);

        // 简单的URL验证
        if (realUrl && (realUrl.startsWith('http://') || realUrl.startsWith('https://') || realUrl.startsWith('//'))) {
          videos.push({ text: link.text, id: realUrl });
        } else {
          console.warn(`解密后的URL格式似乎不正确: ${realUrl}`);
        }
      } catch (error) {
        // 捕获单个播放链接处理时的错误，不影响其他集数
        console.error(`处理播放链接 "${link.text}" 时发生错误:`, error);
        continue;
      }
    }

    return <IMovie>{
      id,
      title,
      cover,
      desc,
      remark,
      playlist: videos.length > 0 ? [{ title: '播放列表', videos }] : [], // 如果没有视频，返回空列表
    };
  }

  async getSearch() {
    const wd = env.get('keyword');
    const page = env.get('page') || '1';

    if (!wd) {
      console.warn('搜索关键词为空');
      return [];
    }

    try {
      const path = CONFIG.URL_TEMPLATES.SEARCH(wd, page);
      const url = `${CONFIG.BASE_URL}${path}`;
      console.log(`Searching: ${url}`);

      const html = await robustReq(url);
      const $ = kitty.load(html);

      return $(CONFIG.SELECTORS.VOD_LIST)
        .toArray()
        .map(item => this.parseVideoItem(item, $))
        .filter(v => v.id && v.title);
    } catch (error) {
      console.error('搜索失败:', error);
      return []; // 搜索失败返回空结果
    }
  }

  async parseIframe() {
    return ''; // 已在 getDetail 中提前解密，无需再解析
  }
}
