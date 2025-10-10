// ts/xlys.ts
// 小猫影视 JS 扩展源：修罗影视 (xl01.com.de)
// 作者：花专用

export default class xlys implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "xlys$",
      name: "修罗影视",
      type: 1,
      nsfw: false,
      api: "https://xl01.com.de",
    }
  }

  async getCategory() {
    return [
      { text: "动作", id: "/s/dongzuo" },
      { text: "爱情", id: "/s/aiqing" },
      { text: "喜剧", id: "/s/xiju" },
      { text: "科幻", id: "/s/kehuan" },
      { text: "恐怖", id: "/s/kongbu" },
      { text: "战争", id: "/s/zhanzheng" },
      { text: "武侠", id: "/s/wuxia" },
      { text: "魔幻", id: "/s/mohuan" },
      { text: "剧情", id: "/s/juqing" },
      { text: "动画", id: "/s/donghua" },
      { text: "惊悚", id: "/s/jingsong" },
      { text: "3D", id: "/s/3D" },
      { text: "灾难", id: "/s/zainan" },
      { text: "悬疑", id: "/s/xuanyi" },
      { text: "警匪", id: "/s/jingfei" },
      { text: "文艺", id: "/s/wenyi" },
      { text: "青春", id: "/s/qingchun" },
      { text: "冒险", id: "/s/maoxian" },
      { text: "犯罪", id: "/s/fanzui" },
      { text: "纪录", id: "/s/jilu" },
      { text: "古装", id: "/s/guzhuang" },
      { text: "奇幻", id: "/s/qihuan" },
      { text: "国语", id: "/s/guoyu" },
      { text: "综艺", id: "/s/zongyi" },
      { text: "历史", id: "/s/lishi" },
      { text: "运动", id: "/s/yundong" },
      { text: "原创压制", id: "/s/yuanchuang" },
      { text: "美剧", id: "/s/meiju" },
      { text: "韩剧", id: "/s/hanju" },
      { text: "国产电视剧", id: "/s/guoju" },
      { text: "日剧", id: "/s/riju" },
      { text: "英剧", id: "/s/yingju" },
      { text: "德剧", id: "/s/deju" },
      { text: "俄剧", id: "/s/eju" },
      { text: "巴剧", id: "/s/baju" },
      { text: "加剧", id: "/s/jiaju" },
      { text: "西剧", id: "/s/spanish" },
      { text: "意大利剧", id: "/s/yidaliju" },
      { text: "泰剧", id: "/s/taiju" },
      { text: "港台剧", id: "/s/gangtaiju" },
      { text: "法剧", id: "/s/faju" },
      { text: "澳剧", id: "/s/aoju" },
      { text: "短剧", id: "/s/duanju" },
    ]
  }

  async getHome() {
    const cate = env.get<string>('category') || '/s/all'
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}${cate}/${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.card.card-sm.card-link').toArray().map(item => {
      const a = $(item).find('a').first()
      const id = a.attr('href') ?? ""
      const title = $(item).find('h3.card-title').text().trim()
      let cover = $(item).find('img').attr('src') || ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remark = $(item).find('.badge').text().trim()
      return { id, title, cover, remark }
    })
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`)
    const $ = kitty.load(html)

    const title = $('h1, .card-title').first().text().trim()
    let cover = $('.poster img, .module-info-poster img').attr('src') || ""
    if (cover.startsWith('//')) cover = 'https:' + cover
    const desc = $('.desc, .module-info-introduction').text().trim()

    const playlist: IPlaylist[] = []
    $('.stui-content__playlist, .playlist, .module-play-list').each((i, el) => {
      const lineTitle = $(el).prev().text().trim() || `线路${i+1}`
      const videos = $(el).find('a').toArray().map(a => {
        const href = $(a).attr('href') ?? ""
        const text = $(a).text().trim()
        return { id: href, text }
      })
      if (videos.length) playlist.push({ title: lineTitle, videos })
    })

    return { id, title, cover, desc, playlist }
  }

  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/search/${encodeURIComponent(wd)}/${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.card.card-sm.card-link').toArray().map<IMovie>(el => {
      const a = $(el).find('a').first()
      const id = a.attr('href') ?? ''
      const title = $(el).find('h3.card-title').text().trim()
      let cover = $(el).find('img').attr('src') ?? ''
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remark = $(el).find('.badge').text().trim()
      return { id, title, cover, desc: '', remark, playlist: [] }
    })
  }

  async parseIframe() {
    // 优先用工具函数解析 m3u8
    return kitty.utils.getM3u8WithIframe(env)
  }
}
