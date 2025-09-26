// 樱花动漫(yhdm668.com)JS源实现
// 适配樱花动漫网站结构，支持分类浏览、动漫详情、搜索和播放解析
export default class YHDM668 implements Handle {
  // 源配置信息
  getConfig() {
    return <Iconfig>{
      id: 'yhdm668',
      name: '樱花动漫',
      api: 'https://www.yhdm668.com',
      nsfw: false,
      type: 1,
      extra: {
        gfw: false,
        timeout: 15000,
        description: '提供各类动漫、电影、电视剧资源在线观看'
      },
      logo: 'https://picsum.photos/200/200?random=2',
      version: '1.0.1'
    }
  }

  // 获取分类列表（适配yhdm668的分类结构）
  async getCategory() {
    try {
      // 樱花动漫实际分类结构
      return <ICategory[]>[
        { text: 'TV动漫', id: '4', type: 'category' },
        { text: '剧场版动漫', id: '20', type: 'category' },
        { text: '电影', id: '1', type: 'category' },
        { text: '连续剧', id: '2', type: 'category' },
        { text: '短剧', id: '3', type: 'category' },
        { text: '热榜', id: 'hot', type: 'label' },
        { text: '今日更新', id: 'new', type: 'label' },
        { text: '周表', id: 'week', type: 'label' }
      ];
    } catch (error) {
      console.error('获取樱花动漫分类失败:', error);
      // 失败时返回简化分类
      return [
        { text: 'TV动漫', id: '4' },
        { text: '电影', id: '1' },
        { text: '热榜', id: 'hot' }
      ] as ICategory[];
    }
  }

  // 解析列表（针对yhdm668的页面结构优化）
  private _parseList($: any, type: string): IMovie[] {
    const items: IMovie[] = [];
    const baseUrl = env.baseUrl;

    // 樱花动漫专用选择器
    const selectors = [
      '.module .module-items a.module-poster-item',
      '.stui-vodlist__box a',
      '.vodlist li a',
      '.grid-view .item a',
      '.list-view .item a'
    ];

    let selectorUsed = '';
    let foundItems = false;

    // 尝试不同选择器
    for (const selector of selectors) {
      if ($(selector).length > 0) {
        selectorUsed = selector;
        $(selector).each((_: number, el: any) => {
          const $el = $(el);
          
          // 提取链接
          let href = $el.attr('href') || '';
          if (!href) return;
          if (!/^https?:\/\//.test(href)) {
            href = href.startsWith('/') ? `${baseUrl}${href}` : `${baseUrl}/${href}`;
          }

          // 提取封面图（樱花动漫常用data-original存储图片）
          let cover = 
            $el.find('img').attr('data-original') ||
            $el.find('img').attr('data-src') ||
            $el.find('img').attr('src') ||
            '';
          if (cover && cover.startsWith('//')) cover = `https:${cover}`;
          if (cover && !/^https?:\/\//.test(cover)) {
            cover = cover.startsWith('/') ? `${baseUrl}${cover}` : `${baseUrl}/${cover}`;
          }

          // 提取标题
          const title = 
            $el.find('.module-poster-item-title').text().trim() ||
            $el.find('.stui-vodlist__title').text().trim() ||
            $el.find('img').attr('alt') ||
            $el.attr('title') ||
            `未知${type}`;

          // 提取更新状态/集数信息
          const remark = 
            $el.find('.module-item-note').text().trim() ||
            $el.find('.stui-vodlist__detail').text().trim() ||
            $el.find('.info').text().trim() ||
            '';

          // 添加到结果集
          items.push({
            id: href,
            title,
            cover,
            desc: '',
            remark,
            playlist: [],
            info: { type }
          });
        });
        foundItems = true;
        break;
      }
    }

    // 兜底解析方案
    if (!foundItems) {
      console.log('主选择器解析失败，尝试樱花动漫兜底方案');
      $('a').each((_: number, el: any) => {
        const $a = $(el);
        let href = $a.attr('href') || '';
        if (!href || !href.includes('/index.php/vod/detail/id/')) return;

        const title = $a.attr('title') || $a.text().trim();
        if (!title || title.length < 2) return;

        items.push({
          id: href.startsWith('http') ? href : `${baseUrl}${href}`,
          title,
          cover: '',
          desc: '',
          remark: '',
          playlist: []
        });
      });
    }

    console.log(`樱花动漫解析到 ${items.length} 个${type}项目 (选择器: ${selectorUsed})`);
    return items;
  }

  // 获取首页/分类内容
  async getHome() {
    try {
      const cate = env.get<string>('category') || '4'; // 默认TV动漫
      const page = env.get<number>('page') || 1;
      const baseUrl = env.config.api;
      
      console.log(`加载樱花动漫分类: ${cate}, 页码: ${page}`);

      // 构建樱花动漫专用URL
      let url = '';
      if (['hot', 'new', 'week'].includes(cate)) {
        // 标签类URL
        url = `${baseUrl}/index.php/label/${cate}.html`;
        if (page > 1) url += `?page=${page}`;
      } else {
        // 分类类URL
        url = `${baseUrl}/index.php/vod/type/id/${cate}.html`;
        if (page > 1) url += `?page=${page}`;
      }

      // 发送请求（模拟浏览器行为）
      const response = await req(url, {
        headers: this._getHeaders(),
        timeout: env.config.extra.timeout,
        responseType: 'full'
      });

      // 检查响应状态
      if (!response || (response.status && !String(response.status).startsWith('2'))) {
        console.error(`樱花动漫请求失败，状态码: ${response?.status || '无响应'}`);
        // 尝试不带page参数的URL（樱花动漫第一页可能不带page）
        if (page === 1) {
          const simpleUrl = url.replace('?page=1', '');
          console.log(`尝试简化URL: ${simpleUrl}`);
          const simpleResponse = await req(simpleUrl, { headers: this._getHeaders() });
          if (simpleResponse) {
            const $ = kitty.load(simpleResponse.data || simpleResponse);
            return this._parseList($, this._getTypeName(cate));
          }
        }
        return [];
      }

      const html = response.data || response;
      if (!html || typeof html !== 'string' || html.length < 1000) {
        console.error('樱花动漫内容为空或无效');
        return [];
      }

      // 解析页面内容
      const $ = kitty.load(html);
      return this._parseList($, this._getTypeName(cate));
    } catch (error) {
      console.error('樱花动漫获取内容失败:', error);
      return [];
    }
  }

  // 获取影片详情
  async getDetail() {
    try {
      const movieId = env.get<string>('movieId') || '';
      if (!movieId) {
        console.error('缺少影片ID');
        return <IMovie>{ id: '', title: '', cover: '', desc: '缺少影片ID', playlist: [] };
      }

      // 构建详情页URL
      const url = movieId.startsWith('http') ? movieId : `${env.baseUrl}${movieId.startsWith('/') ? movieId : '/' + movieId}`;
      console.log(`加载樱花动漫详情页: ${url}`);

      // 发送请求
      const html = await req(url, {
        headers: this._getHeaders(),
        timeout: env.config.extra.timeout
      });

      if (!html) {
        console.error('详情页内容为空');
        return <IMovie>{ id: movieId, title: '', cover: '', desc: '无法加载详情', playlist: [] };
      }

      const $ = kitty.load(html);

      // 提取基本信息
      const title = 
        $('.module-info-heading .module-info-title').first().text().trim() ||
        $('h1').first().text().trim() ||
        $('title').text().split('-')[0].trim() ||
        '未知影片';

      // 提取封面图
      let cover = 
        $('.module-info-poster img').attr('data-original') ||
        $('.module-info-poster img').attr('src') ||
        $('meta[property="og:image"]').attr('content') ||
        '';
      if (cover && cover.startsWith('//')) cover = `https:${cover}`;
      if (cover && !/^https?:\/\//.test(cover)) {
        cover = cover.startsWith('/') ? `${env.baseUrl}${cover}` : `${env.baseUrl}/${cover}`;
      }

      // 提取描述信息
      const desc = 
        $('.module-info-intro').text().trim() ||
        $('.info-desc').text().trim() ||
        '';

      // 提取影片信息
      const info: Record<string, string> = {};
      $('.module-info-item').each((_: number, el: any) => {
        const text = $(el).text().trim();
        const [key, value] = text.split('：').map(t => t.trim());
        if (key && value) info[key] = value;
      });

      // 提取播放列表（适配樱花动漫的播放列表结构）
      const playlist: IPlaylist[] = [];
      const episodeGroups = $('.module-play-list');

      if (episodeGroups.length > 0) {
        // 处理分集播放列表
        const episodes: { text: string; id: string }[] = [];
        
        episodeGroups.find('a').each((__: number, el: any) => {
          const $el = $(el);
          const text = $el.text().trim() || `第${episodes.length + 1}集`;
          let href = $el.attr('href') || '';
          
          if (href && !/^https?:\/\//.test(href)) {
            href = href.startsWith('/') ? `${env.baseUrl}${href}` : `${env.baseUrl}/${href}`;
          }
          
          if (href) episodes.push({ text, id: href });
        });
        
        if (episodes.length > 0) {
          playlist.push({ 
            title: info['类型'] || '播放列表', 
            videos: episodes 
          });
        }
      }

      // 尝试直接提取播放地址
      let directUrl = this._extractPlayUrl(html);
      if (directUrl) {
        playlist.unshift({
          title: '直接播放',
          videos: [{ text: '立即播放', url: directUrl }]
        });
      }

      // 兜底播放方案
      if (playlist.length === 0) {
        playlist.push({ 
          title: '播放', 
          videos: [{ text: '点击播放', id: url }] 
        });
      }

      return <IMovie>{
        id: url,
        title,
        cover,
        desc: desc || `类型: ${info['类型'] || '未知'}\n地区: ${info['地区'] || '未知'}\n年份: ${info['年份'] || '未知'}`,
        remark: `更新: ${info['更新至'] || '未知'}`,
        playlist,
        info
      };
    } catch (error) {
      console.error('樱花动漫获取详情失败:', error);
      return <IMovie>{ id: '', title: '', cover: '', desc: '获取详情失败', playlist: [] };
    }
  }

  // 搜索功能
  async getSearch() {
    try {
      const keyword = env.get<string>('keyword') || '';
      const page = env.get<number>('page') || 1;
      
      if (!keyword || keyword.length < 2) {
        console.log('搜索关键词过短');
        return [];
      }

      console.log(`樱花动漫搜索: ${keyword}, 页码: ${page}`);

      // 构建搜索URL
      const url = `${env.baseUrl}/index.php/vod/search.html?wd=${encodeURIComponent(keyword)}&page=${page}`;
      
      // 发送请求
      const html = await req(url, {
        headers: this._getHeaders(),
        timeout: env.config.extra.timeout
      });

      if (!html) {
        console.error('搜索结果为空');
        return [];
      }

      // 解析搜索结果
      const $ = kitty.load(html);
      return this._parseList($, '搜索结果').map(item => ({
        ...item,
        remark: `搜索: ${keyword} ${item.remark ? '· ' + item.remark : ''}`
      }));
    } catch (error) {
      console.error('樱花动漫搜索失败:', error);
      return [];
    }
  }

  // 解析播放地址
  async parseIframe() {
    try {
      const iframeUrl = env.get<string>('iframe') || '';
      if (!iframeUrl) {
        throw new Error('缺少播放地址');
      }

      console.log(`解析樱花动漫播放地址: ${iframeUrl}`);

      // 处理相对路径
      let url = iframeUrl;
      if (!url.startsWith('http') && env.baseUrl) {
        url = url.startsWith('/') ? `${env.baseUrl}${url}` : `${env.baseUrl}/${url}`;
      }

      // 获取播放页内容
      const html = await req(url, {
        headers: this._getHeaders(),
        timeout: env.config.extra.timeout
      });

      if (!html) {
        throw new Error('播放页内容为空');
      }

      // 提取播放地址
      const playUrl = this._extractPlayUrl(html);
      if (playUrl) {
        console.log(`提取到樱花动漫播放地址: ${playUrl}`);
        return playUrl;
      }

      // 尝试解析嵌套iframe
      const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      if (iframeMatch && iframeMatch[1]) {
        console.log('发现嵌套iframe，尝试二次解析');
        let nestedIframeUrl = iframeMatch[1];
        if (!nestedIframeUrl.startsWith('http')) {
          nestedIframeUrl = new URL(nestedIframeUrl, url).href;
        }
        const nestedHtml = await req(nestedIframeUrl, { headers: this._getHeaders() });
        const nestedPlayUrl = this._extractPlayUrl(nestedHtml);
        if (nestedPlayUrl) {
          console.log(`从嵌套iframe提取到播放地址: ${nestedPlayUrl}`);
          return nestedPlayUrl;
        }
      }

      throw new Error('未找到有效的播放地址');
    } catch (error) {
      console.error('解析樱花动漫播放地址失败:', error);
      return '';
    }
  }

  // 樱花动漫专用请求头
  private _getHeaders() {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
      'Referer': env.baseUrl,
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };
  }

  // 提取播放地址（针对樱花动漫的加密方式）
  private _extractPlayUrl(html: string) {
    // 匹配m3u8地址
    const m3u8Match = 
      html.match(/https?:\/\/[^\s'"<>]+\.m3u8[^\s'"<>]*/i) ||
      html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i);
    
    if (m3u8Match && m3u8Match[1]) return m3u8Match[1];
    if (m3u8Match && m3u8Match[0]) return m3u8Match[0];

    // 匹配mp4等视频地址
    const videoMatch = 
      html.match(/https?:\/\/[^\s'"<>]+\.(mp4|flv|mov|avi|mkv)[^\s'"<>]*/i) ||
      html.match(/["'](https?:\/\/[^"']+\.(mp4|flv|mov|avi|mkv)[^"']*)["']/i);
    
    if (videoMatch && videoMatch[1]) return videoMatch[1];
    if (videoMatch && videoMatch[0]) return videoMatch[0];

    // 樱花动漫特有的加密地址提取
    const encryptedMatch = html.match(/player_data\s*=\s*\{.*?url\s*:\s*["']([^"']+)["']/i);
    if (encryptedMatch && encryptedMatch[1]) {
      try {
        // 樱花动漫常用的加密方式处理
        let decoded = encryptedMatch[1];
        // 尝试URL解码
        try {
          decoded = decodeURIComponent(decoded);
        } catch (e) { /* 解码失败则使用原始值 */ }
        return decoded;
      } catch (e) {
        return encryptedMatch[1];
      }
    }

    return '';
  }

  // 获取分类名称
  private _getTypeName(cate: string) {
    const typeMap: Record<string, string> = {
      '4': 'TV动漫',
      '20': '剧场版动漫',
      '1': '电影',
      '2': '连续剧',
      '3': '短剧',
      'hot': '热榜',
      'new': '今日更新',
      'week': '周表'
    };
    return typeMap[cate] || '动漫';
  }
}

// 测试代码
// const env = createTestEnv('https://www.yhdm668.com');
// const yhdm = new YHDM668();
// 
// (async () => {
//   console.log('===== 开始测试樱花动漫源 =====');
//   
//   // 测试分类
//   console.log('\n1. 测试分类列表');
//   const categories = await yhdm.getCategory();
//   console.log(`获取到${categories.length}个分类:`, categories.map(c => c.text));
//   
//   // 测试首页内容
//   if (categories.length > 0) {
//     console.log('\n2. 测试首页内容');
//     env.set('category', categories[0].id);
//     env.set('page', 1);
//     const homeItems = await yhdm.getHome();
//     console.log(`首页获取到${homeItems.length}个项目`);
//     if (homeItems.length > 0) {
//       console.log('部分项目:', homeItems.slice(0, 3).map(i => i.title));
//       
//       // 测试详情页
//       console.log('\n3. 测试详情页');
//       env.set('movieId', homeItems[0].id);
//       const detail = await yhdm.getDetail();
//       console.log(`详情页标题: ${detail.title}`);
//       console.log(`播放列表数量: ${detail.playlist.length}`);
//     }
//   }
//   
//   // 测试搜索
//   console.log('\n4. 测试搜索功能');
//   env.set('keyword', '火影忍者');
//   const searchResult = await yhdm.getSearch();
//   console.log(`搜索结果数量: ${searchResult.length}`);
//   
//   console.log('\n===== 测试结束 =====');
// })();
    
