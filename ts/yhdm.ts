// import { kitty, req, createTestEnv } from 'utils'

export default class YHDM668 implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'yhdm668',
      name: '樱花动漫',
      api: 'https://www.yhdm668.com',
      nsfw: false,
      type: 1,
      extra: {
        gfw: false // 添加是否需要科学上网的标识
      }
    }
  }

  async getCategory() {
    // 修复：将分类ID修改为更简洁的形式，仅保留参数部分
    return <ICategory[]>[
      { text: 'TV动漫', id: '4' },
      { text: '剧场版动漫', id: '20' },
      { text: '电影', id: '1' },
      { text: '连续剧', id: '2' },
      { text: '短剧', id: '3' },
      { text: '热榜', id: 'hot' },
      { text: '今日更新', id: 'new' },
      { text: '周表', id: 'week' },
    ]
  }

  // 统一列表解析
  private _parseList($: any): IMovie[] {
    const items: IMovie[] = [];
    
    // 修复：使用更通用的选择器，增加容错性
    const selectors = [
      '.module .module-items a.module-poster-item',
      '.stui-vodlist__box a',
      '.vodlist a',
      '.listbox a'
    ];
    
    let found = false;
    for (const selector of selectors) {
      if ($(selector).length > 0) {
        $(selector).each((_: any, el: any) => {
          const $a = $(el);
          let href = $a.attr('href') || '';
          if (!href) return;
          // 确保链接正确
          if (!/^https?:/.test(href)) {
            href = href.startsWith('/') ? `${env.baseUrl}${href}` : `${env.baseUrl}/${href}`;
          }

          let img =
            $a.find('img').attr('data-original') ||
            $a.find('img').attr('data-src') ||
            $a.find('img').attr('src') ||
            '';
          if (img && img.startsWith('//')) img = 'https:' + img;
          // 补充相对路径的图片
          if (img && !/^https?:/.test(img)) {
            img = img.startsWith('/') ? `https://www.yhdm668.com${img}` : `https://www.yhdm668.com/${img}`;
          }

          const title =
            ($a.find('.module-poster-item-title, .stui-vodlist__title, .title').text() || '').trim() ||
            ($a.attr('title') || '').trim();

          const remark = ($a.find('.module-item-note, .note, .tag').text() || '').trim();

          items.push({
            id: href,
            title,
            cover: img || '',
            desc: '',
            remark,
            playlist: [],
          });
        });
        found = true;
        break;
      }
    }

    // 兜底逻辑
    if (!found) {
      console.log('未找到匹配的列表选择器，尝试通用链接选择器');
      $('a').each((_: any, el: any) => {
        const $a = $(el);
        let href = $a.attr('href') || '';
        // 只保留包含详情页的链接
        if (!href || !href.includes('/detail/') && !href.includes('/vod/play/')) return;
        
        if (!/^https?:/.test(href)) {
          href = href.startsWith('/') ? `${env.baseUrl}${href}` : `${env.baseUrl}/${href}`;
        }

        let img = $a.find('img').attr('data-original') || $a.find('img').attr('src') || '';
        if (img && img.startsWith('//')) img = 'https:' + img;

        const title = ($a.attr('title') || $a.text() || '').trim();
        if (title) { // 只添加有标题的项
          items.push({ id: href, title, cover: img, desc: '', remark: '', playlist: [] });
        }
      });
    }

    return items;
  }

  async getHome() {
    try {
      const cate = env.get<string>('category') || '4'; // 默认TV动漫
      const page = env.get<number>('page') || 1;
      
      // 修复：根据分类类型构建不同的URL
      let url = '';
      if (['hot', 'new', 'week'].includes(cate)) {
        // 标签类URL
        url = `${env.baseUrl}/index.php/label/${cate}.html${page > 1 ? `?page=${page}` : ''}`;
      } else {
        // 分类类URL
        url = `${env.baseUrl}/index.php/vod/type/id/${cate}.html${page > 1 ? `?page=${page}` : ''}`;
      }
      
      console.log('请求URL:', url); // 调试信息
      
      // 添加更完整的请求头，模拟浏览器
      const html = await req(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          'Referer': env.baseUrl,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2'
        }
      });
      
      if (!html) {
        console.error('获取页面内容为空');
        return [];
      }
      
      const $ = kitty.load(html);
      const result = this._parseList($);
      
      console.log(`分类${cate}第${page}页解析到${result.length}个内容`);
      return result;
    } catch (error) {
      console.error('getHome错误:', error);
      return [];
    }
  }

  async getDetail() {
    try {
      const id = env.get<string>('movieId') || '';
      if (!id) {
        console.error('缺少movieId参数');
        return <IMovie>{ id: '', title: '', cover: '', desc: '缺少视频ID', playlist: [] };
      }
      
      const url = id.startsWith('http') ? id : `${env.baseUrl}${id.startsWith('/') ? id : '/' + id}`;
      console.log('详情页URL:', url);
      
      const html = await req(url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0', 
          'Referer': env.baseUrl 
        } 
      });
      
      if (!html) {
        console.error('获取详情页内容为空');
        return <IMovie>{ id, title: '', cover: '', desc: '无法获取详情内容', playlist: [] };
      }
      
      const $ = kitty.load(html);

      const title =
        $('.module-info-heading .module-info-title').first().text().trim() ||
        $('h1').first().text().trim() ||
        $('title').text().trim();

      let cover =
        $('.module-info-poster img').attr('data-original') ||
        $('.module-info-poster img').attr('src') ||
        $('meta[property="og:image"]').attr('content') || // 使用OG标签作为备选
        '';
      
      if (cover && cover.startsWith('//')) cover = 'https:' + cover;
      if (cover && !/^https?:/.test(cover)) {
        cover = cover.startsWith('/') ? `${env.baseUrl}${cover}` : `${env.baseUrl}/${cover}`;
      }

      // 获取描述信息
      const desc = $('.module-info-intro').text().trim() || 
                  $('.info-desc').text().trim() || '';

      const episodes: { text: string; id: string }[] = [];
      // 尝试多种可能的播放列表选择器
      const episodeSelectors = [
        '.module-play-list a', 
        '.module-play-list-link a',
        '.stui-content__playlist a',
        '.playlist a'
      ];
      
      let episodeFound = false;
      for (const selector of episodeSelectors) {
        if ($(selector).length > 0) {
          $(selector).each((_: any, el: any) => {
            const $a = $(el);
            const text = ($a.text() || '').trim();
            let href = $a.attr('href') || '';
            if (!href || !text) return;
            
            if (!/^https?:/.test(href)) {
              href = href.startsWith('/') ? `${env.baseUrl}${href}` : `${env.baseUrl}/${href}`;
            }
            
            episodes.push({ text, id: href });
          });
          episodeFound = true;
          break;
        }
      }

      let directUrl = '';
      $('script').each((_: any, el: any) => {
        const t = $(el).html() || '';
        if (!t) return;
        // 增强m3u8链接的匹配模式
        const m =
          t.match(/https?:[^\s'"<>]+\.m3u8[^\s'"<>]*/i) ||
          t.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i) ||
          t.match(/url\s*[:=]\s*["'](https?:\/\/[^"']+)["']/i);
        if (m) {
          directUrl = m[1] || m[0];
        }
      });

      const playlist: IPlaylist[] = [];
      if (directUrl) {
        playlist.push({ title: '默认', videos: [{ text: '在线播放', url: directUrl }] });
      } else if (episodes.length > 0) {
        playlist.push({ title: '默认', videos: episodes });
      } else {
        playlist.push({ title: '默认', videos: [{ text: '打开详情页', id: url }] });
      }

      return <IMovie>{ id: url, title, cover, desc, playlist };
    } catch (error) {
      console.error('getDetail错误:', error);
      return <IMovie>{ id: '', title: '', cover: '', desc: '获取详情失败', playlist: [] };
    }
  }

  async getSearch() {
    try {
      const wd = env.get<string>('keyword') || '';
      const page = env.get<number>('page') || 1;
      if (!wd) return [];

      const url = `${env.baseUrl}/index.php/vod/search.html?wd=${encodeURIComponent(wd)}&page=${page}`;
      console.log('搜索URL:', url);
      
      const html = await req(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': env.baseUrl
        }
      });
      
      if (!html) return [];
      
      const $ = kitty.load(html);
      const result = this._parseList($).map(it => ({ ...it, remark: '搜索结果' }));
      console.log(`搜索"${wd}"第${page}页找到${result.length}个结果`);
      return result;
    } catch (error) {
      console.error('getSearch错误:', error);
      return [];
    }
  }

  // 添加parseIframe方法，处理iframe类型的播放地址
  async parseIframe() {
    try {
      const iframeUrl = env.get<string>('iframe');
      if (!iframeUrl) throw new Error('缺少iframe地址');
      
      console.log('解析iframe:', iframeUrl);
      
      // 处理相对路径
      let url = iframeUrl;
      if (!url.startsWith('http') && env.baseUrl) {
        url = url.startsWith('/') ? `${env.baseUrl}${url}` : `${env.baseUrl}/${url}`;
      }
      
      const html = await req(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': env.baseUrl
        }
      });
      
      if (!html) throw new Error('获取iframe内容失败');
      
      // 尝试从iframe内容中提取m3u8地址
      const m3u8Match = html.match(/https?:\/\/[^\s'"<>]+\.m3u8[^\s'"<>]*/i);
      if (m3u8Match && m3u8Match[0]) {
        console.log('找到m3u8地址:', m3u8Match[0]);
        return m3u8Match[0];
      }
      
      // 尝试其他格式的视频地址
      const videoMatch = html.match(/https?:\/\/[^\s'"<>]+\.(mp4|flv|mkv)[^\s'"<>]*/i);
      if (videoMatch && videoMatch[0]) {
        console.log('找到视频地址:', videoMatch[0]);
        return videoMatch[0];
      }
      
      throw new Error('未找到视频播放地址');
    } catch (error) {
      console.error('解析iframe错误:', error);
      return '';
    }
  }
}

// TEST
// const env = createTestEnv(`https://www.yhdm668.com`)
// const call = new YHDM668();
// (async () => {
//   console.log('测试分类列表');
//   const cates = await call.getCategory()
//   console.log('分类:', cates.map(c => c.text));
//   
//   console.log('测试首页内容');
//   env.set("category", cates[0].id)
//   env.set("page", 1)
//   const home = await call.getHome()
//   console.log(`首页内容数量: ${home.length}`);
//   
//   if (home.length > 0) {
//     console.log('测试详情页');
//     env.set("movieId", home[0].id)
//     const detail = await call.getDetail()
//     console.log('详情页标题:', detail.title);
//     console.log('播放列表数量:', detail.playlist.length);
//   }
//   
//   console.log('测试搜索功能');
//   env.set("keyword", "火影")
//   const search = await call.getSearch()
//   console.log(`搜索结果数量: ${search.length}`);
//   
//   debugger
// })()
