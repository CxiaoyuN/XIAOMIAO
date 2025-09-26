export default class Uaa implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'uaa',
      name: 'UAA影视',
      api: 'https://www.uaa.com',
      nsfw: true,
      type: 1,
    }
  }

  async getCategory() {
    return <ICategory[]>[
      { text: '视频排行榜', id: '/video/rank?type=1' },
      { text: '女优排行榜', id: '/actress' },
      { text: '片商排行榜', id: '/authors' },
    ]
  }

  async getHome() {
    const cate = env.get<string>('category') || '/video/list'
    const page = env.get<number>('page') || 1
    let url = `${env.baseUrl}${cate}`
    if (page > 1) url += `&page=${page}`

    const html = await req(url)
    const $ = kitty.load(html)

    return $('li.video_li').toArray().map<IMovie>(el => {
      const a = $(el).find('.cover_box a')
      const id = a.attr('href') ?? ''
      const title = $(el).find('.brief_box .title a').text().trim()
      let cover = $(el).find('img.cover').attr('src') ?? ''
      if (cover.startsWith('//')) cover = 'https:' + cover

      // 取最后一个 view 的数值（通常是播放量）
      const remark = $(el).find('.info_box .view span').last().text().trim()

      return { id, title, cover, desc: '', remark, playlist: [] }
    })
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const url = id.startsWith('http') ? id : `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('#mui-player').attr('video_title') || $('h1').text().trim()
    let cover = $('article img, .post img, .video-player img').first().attr('src') ?? ''
    if (cover.startsWith('//')) cover = 'https:' + cover
    const desc = $('article, .post-content').text().slice(0, 200)

    const videoUrl = $('#mui-player').attr('src') || ''
    const playlist = [{
      title: '默认',
      videos: videoUrl
        ? [{ text: '在线播放', url: videoUrl }]
        : [{ text: '打开详情页', id: url }]
    }]

    return <IMovie>{ id: url, title, cover, desc, playlist }
  }

  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/video/list?keyword=${encodeURIComponent(wd)}&searchType=1&page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('li.video_li').toArray().map<IMovie>(el => {
      const a = $(el).find('.cover_box a')
      const id = a.attr('href') ?? ''
      const title = $(el).find('.brief_box .title a').text().trim()
      let cover = $(el).find('img.cover').attr('src') ?? ''
      if (cover.startsWith('//')) cover = 'https:' + cover

      return { id, title, cover, desc: '', remark: '搜索结果', playlist: [] }
    })
  }
}
