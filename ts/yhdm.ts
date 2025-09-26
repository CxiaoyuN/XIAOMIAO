// 可直接放入 kitty 源目录使用
export default class YHDM668 {
  getConfig() {
    return {
      id: 'yhdm668',
      name: '樱花动漫',
      api: 'https://www.yhdm668.com',
      nsfw: false,
      type: 1
    }
  }

  async getCategory() {
    // 站内栏目同时提供中文名与固定英文 slug（页面上就这么显示）
    return [
      { text: 'TV动漫', id: '/TVdongman' },
      { text: '剧场版动漫', id: '/juchangbandongman' },
      { text: '电影', id: '/dianying' },
      { text: '连续剧', id: '/lianxuju' },
      { text: '短剧', id: '/duanju' }
    ]
  }

  // 统一的列表解析方法（首页、分类、搜索都用它）
  _parseList($) {
    const items = []
    // 优先：常见卡片结构
    $('.module-item, .module-items .module-item, .module-poster-item, .module-card-item, .public-list-box .public-list-item').each((_, el) => {
      const $el = $(el)
      let a = $el.find('a').first()
      if (!a || a.length === 0) a = $el.find('a.module-item-cover, a.module-poster-item').first()
      if (!a || a.length === 0) return

      let href = a.attr('href') || ''
      if (href && !/^https?:/.test(href)) href = `${env.baseUrl}${href}`

      // 封面
      let img = $el.find('img').last().attr('data-src') || $el.find('img').last().attr('src') || ''
      if (!img) img = a.find('img').attr('data-src') || a.find('img').attr('src') || ''
      if (img && img.startsWith('//')) img = 'https:' + img

      // 标题
      let title =
        ($el.find('.module-item-title, .video-name, .title, .module-poster-item-title').text() || '').trim() ||
        (a.attr('title') || '').trim() ||
        ($el.find('img').attr('alt') || '').trim()

      // 备注（更新到第X集等）
      let remark =
        ($el.find('.module-item-note, .module-item-text, .module-info-item, .module-info-tag').text() || '').trim() ||
        ($el.find('.video-remarks, .module-poster-item-info').text() || '').trim()

      if (href) {
        items.push({ id: href, title, cover: img || '', desc: '', remark, playlist: [] })
      }
    })

    // 兜底：列表页可能是简单 ul/li
    if (items.length === 0) {
      $('a[href*="/v/"], a[href*="/play/"], a[href*="/detail/"]').each((_, el) => {
        const $a = $(el)
        let href = $a.attr('href') || ''
        if (!href) return
        if (!/^https?:/.test(href)) href = `${env.baseUrl}${href}`

        let img = $a.find('img').attr('src') || ''
        if (img && img.startsWith('//')) img = 'https:' + img

        const title = ($a.attr('title') || $a.text() || '').trim()
        items.push({ id: href, title, cover: img, desc: '', remark: '', playlist: [] })
      })
    }

    return items
  }

  async getHome() {
    const cate = env.get('category') || '/TVdongman'
    const page = env.get('page') || 1
    const url = `${env.baseUrl}${cate}?page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)
    return this._parseList($)
  }

  async getDetail() {
    const id = env.get('movieId') || ''
    const url = id.startsWith('http') ? id : `${env.baseUrl}${id}`
    const html = await req(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': env.baseUrl } })
    const $ = kitty.load(html)

    // 标题与封面
    const title =
      $('h1, .module-info-heading .module-info-title, .page-title').first().text().trim() ||
      $('title').text().trim()
    let cover =
      $('.module-info-poster img, .poster img, .module-poster-item img').first().attr('src') ||
      $('img').first().attr('src') || ''
    if (cover && cover.startsWith('//')) cover = 'https:' + cover

    // 播放链接解析：常见播放器脚本里包含 m3u8/直链
    const scripts = []
    $('script').each((_, el) => {
      const t = $(el).html() || ''
      if (t) scripts.push(t)
    })

    let playUrl = ''
    for (const s of scripts) {
      // 常见匹配：m3u8 或直链
      let m =
        s.match(/https?:[^\s'"]+\.m3u8[^\s'"]*/i) ||
        s.match(/url\s*[:=]\s*["'](https?:[^"']+)["']/i) ||
        s.match(/src\s*[:=]\s*["'](https?:[^"']+)["']/i)
      if (m && m[0]) {
        playUrl = Array.isArray(m) ? (m[1] || m[0]) : m[0]
        break
      }
    }

    // 兜底：页面上直接的 a[href] 可能包含播放页
    if (!playUrl) {
      const a = $('a[href*=".m3u8"]').first()
      if (a.length) playUrl = a.attr('href') || ''
    }

    const playlist = [{
      title: '默认',
      videos: playUrl ? [{ text: '在线播放', url: playUrl }] : []
    }]

    return { id: url, title, cover, desc: '', playlist }
  }

  async getSearch() {
    const wd = env.get('keyword') || ''
    const page = env.get('page') || 1
    if (!wd) return []

    const url = `${env.baseUrl}/search?wd=${encodeURIComponent(wd)}&page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)
    return this._parseList($).map(it => ({ ...it, remark: '搜索结果' }))
  }
}
