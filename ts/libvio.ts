// import { kitty, req, createTestEnv } from 'utils'

export default class libvio implements Handle {
  // 声明类级别的env变量，避免重复创建
  private env = createTestEnv(this.getConfig().api);

  getConfig() {
    return <Iconfig>{
      id: 'libvio',
      name: 'LIBVIO',
      api: 'https://www.libvio.cc',
      nsfw: false,
      type: 1,
    }
  }

  // 根据最新分类链接修正分类列表
  async getCategory() {
    return <ICategory[]>[
      { text: "电影", id: "1" },       // 对应 /type/1.html
      { text: "剧集", id: "2" },       // 对应 /type/2.html（修正为"剧集"）
      { text: "动漫", id: "4" },       // 对应 /type/4.html
      { text: "韩剧", id: "15" },    // 对应 /type/15.html
      { text: "美剧", id: "16" }     // 对应 /type/16.html（修正为"欧美剧"）
    ]
  }

  // 修正视频列表提取逻辑（匹配新的页面结构）
  async getHome() {
    const cate = this.env.get("category");
    const page = this.env.get("page") || 1;
    // 修正分类页URL格式（匹配/type/{id}.html结构）
    const url = `${this.env.baseUrl}/type/${cate}.html?page=${page}`;
    
    try {
      const html = await req(url);
      const $ = kitty.load(html);
      
      // 匹配新的视频列表结构
      return $(".stui-vodlist__box").toArray().map<IMovie>(item => {
        const a = $(item).find("a.stui-vodlist__thumb");
        return <IMovie>{
          id: a.attr("href") ?? "",       // 提取/detail/xxx.html格式的详情页链接
          title: a.attr("title") ?? "",   // 从title属性获取名称
          cover: a.attr("data-original") ?? "",  // 提取封面图
          remark: a.find(".pic-text.text-right").text() ?? ""  // 提取"已完结"等状态
        };
      });
    } catch (error) {
      console.error('获取首页内容失败:', error);
      return [];
    }
  }

  // 修正详情页解析逻辑
  async getDetail() {
    const id = this.env.get("movieId");
    
    if (!id) {
      throw new Error('电影ID不存在');
    }
    
    try {
      // 构建正确的详情页URL（/detail/xxx.html）
      const url = `${this.env.baseUrl}${id}`;
      const html = await req(url);
      const $ = kitty.load(html);
      
      // 提取播放列表标签
      const tabs = $(".nav.nav-tabs li").toArray().map(item => {
        return $(item).text().trim() ?? "";
      });
      
      // 提取播放列表
      const _videos = $(".stui-panel_bd div.tab-pane").toArray().map<IPlaylistVideo[]>((item) => {
        return $(item).find("a").toArray().map(_ => {
          return <IPlaylistVideo>{
            id: $(_).attr("href") ?? "",
            text: $(_).text().trim() ?? ""
          };
        });
      });
      
      const playlist = tabs.map((title, index) => ({
        title,
        videos: _videos[index] || []
      }));
      
      // 提取封面和标题
      const a = $(".stui-pannel-box .stui-vodlist__thumb.picture.v-thumb");
      return <IMovie>{
        id,
        title: a.attr("title") ?? "",
        cover: a.find("img").attr("data-original") ?? "",
        desc: $(".detail.col-pd").text().trim() ?? "",
        playlist
      };
    } catch (error) {
      console.error('获取详情失败:', error);
      return <IMovie>{ id, title: '', cover: '', desc: '', playlist: [] };
    }
  }

  // 修正搜索功能
  async getSearch() {
    const page = this.env.get<string>("page") || "1";
    const wd = this.env.get<string>("keyword");
    
    if (!wd) {
      throw new Error('搜索关键词不存在');
    }
    
    try {
      const url = `${this.env.baseUrl}/vodsearch/${wd}----------${page}---.html`;
      const html = await req(url);
      const $ = kitty.load(html);
      
      // 匹配搜索结果的视频结构
      return $(".stui-vodlist__media li").toArray().map<IMovie>(item => {
        const a = $(item).find(".v-thumb.stui-vodlist__thumb");
        return {
          id: a.attr("href") ?? "",
          title: a.attr("title") ?? "",
          cover: a.attr("data-original") ?? "",
          remark: a.find(".pic-text.text-right").text() ?? ""
        };
      });
    } catch (error) {
      console.error('搜索失败:', error);
      return [];
    }
  }

  // 从player.js中提取播放链接
  async parseIframe() {
    const iframePath = this.env.get<string>("iframe");
    
    if (!iframePath) {
      throw new Error('播放地址不存在');
    }
    
    try {
      // 构建播放页URL
      const playUrl = `${this.env.baseUrl}${iframePath}`;
      const html = await req(playUrl);
      const $ = kitty.load(html);
      
      // 1. 提取player.js的引用地址
      const playerScriptSrc = $("script[src*='player.js']").attr("src");
      if (!playerScriptSrc) {
        throw new Error('未找到player.js');
      }
      
      // 2. 完整的player.js URL
      const fullPlayerUrl = playerScriptSrc.startsWith('http') 
        ? playerScriptSrc 
        : `${this.env.baseUrl}${playerScriptSrc.startsWith('/') ? '' : '/'}${playerScriptSrc}`;
      
      // 3. 请求player.js内容
      const playerJsContent = await req(fullPlayerUrl);
      
      // 4. 从player.js中提取m3u8播放地址（根据实际加密规则调整正则）
      const m3u8Match = playerJsContent.match(/videoUrl\s*=\s*["'](.*?\.m3u8)["']/i) || 
                       playerJsContent.match(/url\s*:\s*["'](.*?\.m3u8)["']/i);
      
      if (m3u8Match && m3u8Match[1]) {
        let url = m3u8Match[1];
        
        // 补全URL协议
        if (url.startsWith('//')) {
          url = `https:${url}`;
        } else if (!url.startsWith('http') && !url.startsWith(this.env.baseUrl)) {
          url = `${this.env.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        
        return url;
      }
      
      // 5. 如果player.js中没有，尝试从页面脚本中提取
      const pageScript = $("script").toArray().find(script => {
        const text = $(script).text();
        return text.includes('.m3u8') && text.includes('play');
      });
      
      if (pageScript) {
        const scriptText = $(pageScript).text();
        const pageM3u8Match = scriptText.match(/["'](https?:\/\/.*?\.m3u8)["']/i);
        if (pageM3u8Match) {
          return pageM3u8Match[1];
        }
      }
      
      throw new Error('未从player.js中找到播放地址');
    } catch (error) {
      console.error('解析播放地址失败:', error);
      return '';
    }
  }
}

// TEST
// const env = createTestEnv("https://www.libvio.cc")
// const tv = new libvio();
// (async () => {
//   const cates = await tv.getCategory()
//   console.log("分类列表:", cates)
//   
//   env.set("category", cates[0].id) // 使用电影分类
//   env.set("page", 1)
//   const home = await tv.getHome()
//   console.log("首页视频:", home.slice(0, 2))
//   
//   if (home.length > 0) {
//     env.set("movieId", home[0].id) // 获取第一个视频的详情
//     const detail = await tv.getDetail()
//     console.log("视频详情:", {
//       title: detail.title,
//       playlistCount: detail.playlist.length
//     })
//     
//     if (detail.playlist.length > 0 && detail.playlist[0].videos.length > 0) {
//       env.set("iframe", detail.playlist[0].videos[0].id)
//       const realM3u8 = await tv.parseIframe()
//       console.log("播放地址:", realM3u8)
//     }
//   }
//   
//   env.set("keyword", "杀手螳螂")
//   const search = await tv.getSearch()
//   console.log("搜索结果:", search)
// })()
