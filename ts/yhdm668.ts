// import { kitty, req, createTestEnv } from 'utils'

export default class yhdm668 implements Handle {
  // 配置信息
  getConfig() {
    return <Iconfig>{
      id: 'yhdm668',
      name: '樱花动漫',
      api: 'https://www.yhdm668.com',
      nsfw: false,
      type: 1
    }
  }

  // 获取分类列表
  async getCategory() {
    return <ICategory[]>[
      { text: '热门', id: '/index.php/label/hot.html' },
      { text: '今日', id: '/index.php/label/new.html' },
      { text: '周更', id: '/index.php/label/week.html' },
      { text: '最近', id: '/index.php/vod/show/id/4.html' },
      { text: '电影', id: '/index.php/vod/type/id/20.html' },
      { text: '连载', id: '/index.php/vod/type/id/4.html' },
      { text: '完结', id: '/index.php/vod/type/id/21.html' },
    ]
  }

  // 获取首页/分类页内容
  async getHome() {
    const env = createTestEnv(this.getConfig().api);
    const cate = env.get('category');
    const page = env.get('page') || 1;
    
    // 构建URL（参考多瑙影院的URL构建方式）
    const hasQuery = cate.includes('?') || cate.includes('&');
    const url = `${env.baseUrl}${cate}${hasQuery ? '&' : '?'}page=${page}`;
    
    // 请求页面并解析（与多瑙影院保持一致）
    const html = await req(url);
    const $ = kitty.load(html);
    
    // 提取视频列表（调整选择器以匹配樱花动漫页面）
    return $('.module-items .module-item').toArray().map(item => {
      const a = $(item).find('a');
      const id = a.attr('href') ?? '';
      const cover = a.find('img').attr('data-original') || a.find('img').attr('src') || '';
      const title = a.attr('title') || a.find('.module-poster-item-title').text().trim() || '';
      const remark = $(item).find('.module-item-note').text().trim() || '';
      
      return <IMovie>{ id, title, cover, remark };
    });
  }

  // 获取视频详情
  async getDetail() {
    const env = createTestEnv(this.getConfig().api);
    const id = env.get('movieId');
    
    if (!id) {
      throw new Error('电影ID不存在');
    }
    
    // 构建详情页URL
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);
    
    // 提取详情信息（参考多瑙影院的解析方式）
    const title = $('.module-info-heading h1').text().trim() || $('title').text().trim() || '';
    const cover = $('.module-info-poster img').attr('data-original') || $('.module-info-poster img').attr('src') || '';
    const desc = $('.module-info-introduction-content').text().trim() || '';
    
    // 提取播放列表标签
    const tabs = $('.module-tab-items-box .module-tab-item').toArray().map(item => {
      return $(item).text().trim();
    });
    
    // 提取播放列表
    const _videos = $('.module-play-list').toArray().map<IPlaylistVideo[]>((item) => {
      return $(item).find('a').toArray().map(a => {
        const videoId = $(a).attr('href') ?? '';
        const text = $(a).text().trim() || '';
        return { id: videoId, text };
      });
    });
    
    // 组合播放列表
    const playlist = tabs.map((tabTitle, index) => {
      const videos = _videos[index] || [];
      return <IPlaylist>{ title: tabTitle, videos };
    });
    
    return <IMovie>{ id, title, cover, desc, playlist };
  }

  // 搜索功能
  async getSearch() {
    const env = createTestEnv(this.getConfig().api);
    const keyword = env.get('keyword');
    const page = env.get('page') || 1;
    
    if (!keyword) {
      throw new Error('搜索关键词不存在');
    }
    
    // 构建搜索URL（与多瑙影院风格一致）
    const url = `${env.baseUrl}/index.php/vod/search/page/${page}/wd/${encodeURIComponent(keyword)}.html`;
    const html = await req(url);
    const $ = kitty.load(html);
    
    // 提取搜索结果
    return $('.module-items .module-search-item').toArray().map<IMovie>(item => {
      const a = $(item).find('a');
      const id = a.attr('href') ?? '';
      const cover = a.find('img').attr('data-original') || a.find('img').attr('src') || '';
      const title = a.attr('title') || a.text().trim() || '';
      const remark = $(item).find('.video-remarks').text().trim() || '';
      
      return { id, cover, title, remark };
    });
  }

  // 解析播放地址（参考多瑙影院的加密处理）
  async parseIframe() {
    const env = createTestEnv(this.getConfig().api);
    const iframePath = env.get<string>('iframe');
    
    if (!iframePath) {
      throw new Error('播放地址不存在');
    }
    
    // 请求播放页面
    const url = `${env.baseUrl}${iframePath}`;
    const html = await req(url);
    const $ = kitty.load(html);
    
    // 提取包含播放地址的脚本（类似多瑙影院的处理方式）
    const script = $("script").toArray().find(item => {
      const text = $(item).text().trim();
      return text.includes('m3u8') || text.includes('player_config');
    });
    
    if (!script) {
      throw new Error('未找到播放配置脚本');
    }
    
    // 提取并解析播放地址
    const scriptContent = $(script).text().trim();
    
    // 匹配m3u8地址（根据樱花动漫的实际加密方式调整）
    const m3u8Match = scriptContent.match(/url\s*[:=]\s*["'](.*?\.m3u8)["']/i);
    if (m3u8Match && m3u8Match[1]) {
      let url = m3u8Match[1];
      
      // 如果有加密，参考多瑙影院的解密逻辑
      if (url.includes('%') || url.length > 100) {
        url = this.customUnescape(url);
        
        // 检查是否需要Base64解码（根据实际情况调整）
        if (scriptContent.includes('base64')) {
          url = this.base64Decode(url);
        }
      }
      
      // 补全URL协议
      if (url.startsWith('//')) {
        url = `https:${url}`;
      } else if (!url.startsWith('http')) {
        url = `${env.baseUrl}${url}`;
      }
      
      return url;
    }
    
    throw new Error('未找到有效的m3u8播放地址');
  }

  // 通用URL解码（复用多瑙影院的实现）
  private customUnescape(str: string) {
    return str.replace(/%u([0-9A-Fa-f]{4})|%([0-9A-Fa-f]{2})/g,
      function (match, unicodeHex, hex) {
        if (unicodeHex) {
          return String.fromCharCode(parseInt(unicodeHex, 16));
        } else {
          return String.fromCharCode(parseInt(hex, 16));
        }
      }
    );
  }

  // Base64解码（复用多瑙影院的实现）
  private base64Decode(input: string) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let i = input.length;
    for (; i > 0 && input[i] !== "="; i--) {
      /* do nothing */
    }
    const str = input.substr(0, i - 1);
    let output = "";
    if (str.length % 4 === 1) {
      return output;
    }
    let bs = 0;
    for (
      let bc = 0, buffer, idx = 0;
      (buffer = str.charAt(idx));
      ~buffer && ((bs = bc % 4 !== 0 ? bs * 64 + buffer : buffer), bc++ % 4) !== 0
        ? (output += String.fromCharCode(255 & (bs >>> ((-2 * bc) & 6))))
        : 0
    ) {
      if (`${buffer}`.length === 0) {
        break;
      }
      buffer = chars.indexOf(buffer);
      idx++;
    }
    return output;
  }
}

// 测试代码（与多瑙影院风格一致）
// const env = createTestEnv("https://www.yhdm668.com")
// const call = new yhdm668()
// ;(async () => {
//   const cates = await call.getCategory()
//   env.set("category", cates[0].id)
//   env.set("page", 1)
//   const home = await call.getHome()
//   console.log("首页内容:", home)
//   
//   if (home.length > 0) {
//     env.set("movieId", home[0].id)
//     const detail = await call.getDetail()
//     console.log("详情内容:", detail)
//     
//     if (detail.playlist && detail.playlist.length > 0 && detail.playlist[0].videos.length > 0) {
//       env.set("iframe", detail.playlist[0].videos[0].id)
//       const realM3u8 = await call.parseIframe()
//       console.log("播放地址:", realM3u8)
//     }
//   }
//   
//   env.set("keyword", "火影")
//   const search = await call.getSearch()
//   console.log("搜索结果:", search)
// })()
