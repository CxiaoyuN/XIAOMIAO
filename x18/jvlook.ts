export default class JvLook implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'jvlook',
      name: 'JvLook影视',
      api: 'https://jvlook.com',
      nsfw: true,
      type: 1,
    }
  }

  // 一级分类
  async getCategory() {
    const url = `${env.api}/index`
    const html = await req(url)
    const $ = kitty.load(html)

    // 根据 jvlook 首页的分类导航修改选择器
    return $('ul.nav li a').toArray().map<ICategory>(el => {
      const a = $(el)
      return {
        text: a.text().trim(),
        id: a.attr('href') || '',
        cover: ''
      }
    })
  }

  // 分类下的视频列表
  async getHome() {
    const cate = env.get<string>('category') || ''
    const page = env.get<number>('page') || 1
    let url = `${env.api}${cate}`
    if (page > 1) url += `?page=${page}`

    const html = await req(url)
    const $ = kitty.load(html)

    // 根据 jvlook 的视频卡片结构修改选择器
    return $('div.video-card').toArray().map<IMovie>(el => {
      const a = $(el).find('a')
      const id = a.attr('href') || ''
      const title = a.attr('title') || a.text().trim()
      const cover = $(el).find('img').attr('src') || ''
      return { id, title, cover, desc: '', remark: '', playlist: [] }
    })
  }

  // 详情页
  async getDetail() {
    const id = env.get<string>('movieId')
    const url = id.startsWith('http') ? id : `${env.api}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('h1').text().trim()
    const cover = $('div.player img, div.player video').attr('src') || ''
    const iframe = $('iframe').attr('src') || ''

    const playlist = [{
      title: '默认',
      videos: iframe
        ? [{ text: '在线播放', id: iframe }]
        : [{ text: '原页面播放', id: url }]
    }]

    return <IMovie>{ id: url, title, cover, desc: '', playlist }
  }

  // 搜索
  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = `${env.api}/search/${encodeURIComponent(wd)}?page=${page}`

    const html = await req(url)
    const $ = kitty.load(html)

    return $('div.video-card').toArray().map<IMovie>(el => {
      const a = $(el).find('a')
      const id = a.attr('href') || ''
      const title = a.attr('title') || a.text().trim()
      const cover = $(el).find('img').attr('src') || ''
      return { id, title, cover, desc: '', remark: '搜索结果', playlist: [] }
    })
  }
}
