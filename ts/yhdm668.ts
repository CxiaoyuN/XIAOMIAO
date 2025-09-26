// import { kitty, req, createTestEnv } from 'utils'

export default class yhdm668 implements Handle {
  // 声明类级别的env变量，避免重复创建
  private env = createTestEnv(this.getConfig().api);

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
    const cate = this.env.get('category');
    const page = this.env.get('page') || 1;
    
    // 构建URL
    const hasQuery = cate.includes('?') || cate.includes('&');
    const url = `${this.env.baseUrl}${cate}${hasQuery ? '&' : '?'}page=${page}`;
    
    try {
      const html = await req(url);
      const $ = kitty.load(html);
      
      return $('.module-items .module-item').toArray().map(item => {
        const a = $(item).find('a');
        return <IMovie>{
          id: a.attr('href') ?? '',
          title: a.attr('title') || a.find('.module-poster-item-title').text().trim() || '',
          cover: a.find('img').attr('data-original') || a.find('img').attr('src') || '',
          remark: $(item).find('.module-item-note').text().trim() || ''
        };
      });
    } catch (error) {
      console.error('获取首页内容失败:', error);
      return []; // 出错时返回空数组，避免JSON解析异常
    }
  }

  // 获取视频详情
  async getDetail() {
    const id = this.env.get('movieId');
    
    if (!id) {
      throw new Error('电影ID不存在');
    }
    
    try {
      const url = `${this.env.baseUrl}${id}`;
      const html = await req(url);
      const $ = kitty.load(html);
      
      const title = $('.module-info-heading h1').text().trim() || $('title').text().trim() || '';
      const cover = $('.module-info-poster img').attr('data-original') || $('.module-info-poster img').attr('src') || '';
      const desc = $('.module-info-introduction-content').text().trim() || '';
      
      const tabs = $('.module-tab-items-box .module-tab-item').toArray().map(item => 
        $(item).text().trim()
      );
      
      const _videos = $('.module-play-list').toArray().map<IPlaylistVideo[]>((item) => 
        $(item).find('a').toArray().map(a => ({
          id: $(a).attr('href') ?? '',
          text: $(a).text().trim() || ''
        }))
      );
      
      const playlist = tabs.map((tabTitle, index) => ({
        title: tabTitle,
        videos: _videos[index] || []
      }));
      
      return <IMovie>{ id, title, cover, desc, playlist };
    } catch (error) {
      console.error('获取详情失败:', error);
      return <IMovie>{ id, title: '', cover: '', desc: '', playlist: [] }; // 返回默认结构
    }
  }

  // 搜索功能
  async getSearch() {
    const keyword = this.env.get('keyword');
    const page = this.env.get('page') || 1;
    
    if (!keyword) {
      throw new Error('搜索关键词不存在');
    }
    
    try {
      const url = `${this.env.baseUrl}/index.php/vod/search/page/${page}/wd/${encodeURIComponent(keyword)}.html`;
      const html = await req(url);
      const $ = kitty.load(html);
      
      return $('.module-items .module-search-item').toArray().map<IMovie>(item => {
        const a = $(item).find('a');
        return {
          id: a.attr('href') ?? '',
          cover: a.find('img').attr('data-original') || a.find('img').attr('src') || '',
          title: a.attr('title') || a.text().trim() || '',
          remark: $(item).find('.video-remarks').text().trim() || ''
        };
      });
    } catch (error) {
      console.error('搜索失败:', error);
      return []; // 出错时返回空数组
    }
  }

  // 解析播放地址
  async parseIframe() {
    const iframePath = this.env.get<string>('iframe');
    
    if (!iframePath) {
      throw new Error('播放地址不存在');
    }
    
    try {
      const url = `${this.env.baseUrl}${iframePath}`;
      const html = await req(url);
      const $ = kitty.load(html);
      
      const script = $("script").toArray().find(item => {
        const text = $(item).text().trim();
        return text.includes('m3u8') || text.includes('player_config');
      });
      
      if (!script) {
        throw new Error('未找到播放配置脚本');
      }
      
      const scriptContent = $(script).text().trim();
      const m3u8Match = scriptContent.match(/url\s*[:=]\s*["'](.*?\.m3u8)["']/i);
      
      if (m3u8Match && m3u8Match[1]) {
        let url = m3u8Match[1];
        
        if (url.includes('%') || url.length > 100) {
          url = this.customUnescape(url);
          if (scriptContent.includes('base64')) {
            url = this.base64Decode(url);
          }
        }
        
        if (url.startsWith('//')) {
          url = `https:${url}`;
        } else if (!url.startsWith('http')) {
          url = `${this.env.baseUrl}${url}`;
        }
        
        return url;
      }
      
      throw new Error('未找到有效的m3u8播放地址');
    } catch (error) {
      console.error('解析播放地址失败:', error);
      return ''; // 出错时返回空字符串
    }
  }

  // 通用URL解码
  private customUnescape(str: string) {
    return str.replace(/%u([0-9A-Fa-f]{4})|%([0-9A-Fa-f]{2})/g,
      (match, unicodeHex, hex) => {
        if (unicodeHex) {
          return String.fromCharCode(parseInt(unicodeHex, 16));
        } else {
          return String.fromCharCode(parseInt(hex, 16));
        }
      }
    );
  }

  // Base64解码
  private base64Decode(input: string) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let i = input.length;
    for (; i > 0 && input[i] !== "="; i--) {}
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
      if (`${buffer}`.length === 0) break;
      buffer = chars.indexOf(buffer);
      idx++;
    }
    return output;
  }
}

// 测试代码（仅声明一次env）
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
