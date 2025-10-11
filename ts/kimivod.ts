export default class kimivod implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "kimivod$",
      name: "KiMivod",
      type: 1,
      nsfw: false,
      api: "https://kimivod.com",
    }
  }

  headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  }

  async getCategory() {
    return [
      { text: "電視", id: "/vod/show/id/1.html" },
      { text: "電影", id: "/vod/show/id/2.html" },
      { text: "動漫", id: "/vod/show/id/3.html" },
      { text: "綜藝", id: "/vod/show/id/4.html" },
      { text: "短劇", id: "/vod/show/id/39.html" },
      { text: "倫理", id: "/vod/show/id/42.html" },
    ]
  }

  async getHome() {
    const cate = env.get<string>('category') || '/vod/show/id/1.html'
    const page = env.get<number>('page') || 1
    const url = page === 1 ? `${env.baseUrl}${cate}` : `${env.baseUrl}${cate.replace('.html', '')}/page/${page}.html`
    const html = await req(url, { headers: this.headers })
    const $ = kitty.load(html)
    const items = $('.grid.container_list .post, .s6.m3.l2').toArray()
    return items.map(item => {
      const a = $(item).find('a').first()
      const id = a.attr('href') ?? ""
      const title = a.attr('title')?.trim() || $(item).find('img').attr('alt')?.trim() || ""
      const cover = $(item).find('img').attr('data-src')?.trim() ?? ""
      const remark = $(item).find('.absolute').text().trim()
      return { id, title, cover, remark, desc: '' }
    })
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`, { headers: this.headers })

    const title = html.match(/<h1[^>]*class="title"[^>]*>(.*?)<\/h1>/)?.[1]?.trim() ?? ""
    const cover = html.match(/<img[^>]*itemprop="image"[^>]*data-src="([^\"]+)"/)?.[1]?.trim() ?? ""
    const desc = html.match(/<meta[^>]*name="description"[^>]*content="([^\"]+)"/)?.[1]?.trim()
      ?? html.match(/一笑隨歌線上看.*?(\d{4}年上映.*?)朱銳斌.*?作品/)?.[1]?.trim()
      ?? ""

    const remark = html.match(/(更新至第?\d+集|全\d+集|共\d+集)/)?.[0]?.trim() ?? ""

    const playlist: IPlaylist[] = []
    const blockRegex = /<div[^>]*class="play_list[^"]*"[^>]*>([\s\S]*?)<\/div>/g
    const blocks = [...html.matchAll(blockRegex)]

    if (blocks.length > 0) {
      blocks.forEach((block, i) => {
        const titleMatch = block[0].match(/<h2[^>]*>(.*?)<\/h2>/)
        const title = titleMatch?.[1]?.trim() || `线路${i + 1}`
        const videoRegex = /<a[^>]*href="([^"]+)"[^>]*>(第?\d+[集话回]?|EP\d+)<\/a>/g
        const videos = [...block[1].matchAll(videoRegex)].map(m => ({
          id: m[1].startsWith('http') ? m[1] : `${env.baseUrl}${m[1]}`,
          text: m[2]
        }))
        if (videos.length > 0) {
          playlist.push({ title, videos })
        }
      })
    }

    if (playlist.length === 0) {
      const vid = id.match(/\d+/)?.[0] ?? ""
      const total = parseInt(remark.match(/\d+/)?.[0] ?? "0")
      if (total > 0) {
        const fallback = Array.from({ length: total }, (_, i) => {
          const ep = i + 1
          return {
            text: `第${ep.toString().padStart(2, '0')}集`,
            id: `${env.baseUrl}/vod/${vid}/1-${ep}.html`
          }
        })
        playlist.push({ title: "线路1", videos: fallback })
      }
    }

    return { id, title, cover, remark, desc, playlist }
  }

  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = page === 1
      ? `https://cn.kimivod.com/search.php?searchword=${encodeURIComponent(wd)}`
      : `https://cn.kimivod.com/search.php?searchword=${encodeURIComponent(wd)}&page=${page}`
    const html = await req(url, { headers: this.headers })
    const $ = kitty.load(html)
    const items = $('a[title]').toArray()
    return items.map(a => {
      const id = $(a).attr('href') ?? ""
      const title = $(a).attr('title')?.trim() ?? ""
      const cover = $(a).find('img').attr('data-src')?.trim() ?? ""
      const remark = $(a).find('.absolute').text().trim()
      return { id, title, cover, remark, desc: '', playlist: [] }
    })
  }

  async parseIframe() {
    const iframe = env.get<string>('iframe')
    const html = await req(iframe.startsWith('http') ? iframe : `${env.baseUrl}${iframe}`, { headers: this.headers })
    const $ = kitty.load(html)
    return $('meta[itemprop="contentUrl"]').attr('content')?.trim() ?? ""
  }
}
