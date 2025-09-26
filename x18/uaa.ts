export default class Uaa implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'uaa',
      name: 'UAA影视',
      api: 'https://www.uaa001.com',
      nsfw: true,
      type: 1,
    }
  }

  async getCategory() {
    return <ICategory[]>[
      { text: '全部', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=&sort=1' },
      { text: '国产', id: '/video/list?keyword=&searchType=1&origin=1&tag=&sort=1' },
      { text: '日本', id: '/video/list?keyword=&searchType=1&origin=2&tag=&sort=1' },
      { text: '动漫', id: '/video/list?keyword=&searchType=1&origin=3&tag=&sort=1' },
      { text: '正规', id: '/video/list?keyword=&searchType=1&origin=4&tag=&sort=1' },
      { text: '欧美', id: '/video/list?keyword=&searchType=1&origin=5&tag=&sort=1' },
      { text: '短剧', id: '/video/list?keyword=&searchType=1&category=%E7%9F%AD%E5%89%A7&origin=&tag=&sort=1' },
      { text: '偷拍', id: '/video/list?keyword=&searchType=1&category=%E5%81%B7%E6%8B%8D&origin=&tag=&sort=1' },
      { text: '00后', id: '/video/list?keyword=&searchType=1&category=00%E5%90%8E%E9%9C%B2%E5%87%BA&origin=&tag=&sort=1' },
      { text: '无码', id: '/video/list?keyword=&searchType=1&category=%E6%97%A0%E7%A0%81%E6%B5%81%E5%87%BA&origin=&tag=&sort=1' },
      { text: '高清', id: '/video/list?keyword=&searchType=1&category=%E9%AB%98%E6%B8%85AV&origin=&tag=&sort=1' },
      { text: '自拍', id: '/video/list?keyword=&searchType=1&category=%E8%87%AA%E6%8B%8D&origin=&tag=&sort=1' },
      { text: '伪娘', id: '/video/list?keyword=&searchType=1&category=%E4%BA%BA%E5%A6%96%E4%BC%AA%E5%A8%98&origin=&tag=&sort=1' },
      { text: '主播', id: '/video/list?keyword=&searchType=1&category=%E4%B8%BB%E6%92%AD%E7%A6%8F%E5%88%A9&origin=&tag=&sort=1' },
      { text: '里番', id: '/video/list?keyword=&searchType=1&category=%E9%87%8C%E7%95%AA&origin=&tag=&sort=1' },
      { text: '泡面', id: '/video/list?keyword=&searchType=1&category=%E6%B3%A1%E9%9D%A2%E7%95%AA&origin=&tag=&sort=1' },

      // 你新增的标签分类
      { text: '白虎', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=%E7%99%BD%E8%99%8E&sort=1' },
      { text: '巨乳', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=%E5%B7%A8%E4%B9%B3&sort=1' },
      { text: '69型', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=69&sort=1' },
      { text: '百合', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=%E7%99%BE%E5%90%88&sort=1' },
      { text: '吞精', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=%E5%90%9E%E7%B2%BE&sort=1' },
      { text: '颜面', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=%E9%A2%9C%E9%9D%A2%E9%AA%91%E4%B9%98&sort=1' },
      { text: '淫语', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=%E6%B7%AB%E8%AF%AD&sort=1' },
      { text: '口交', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=%E5%8F%A3%E4%BA%A4&sort=1' },
      { text: '口爆', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=%E5%8F%A3%E7%88%86&sort=1' },

      // 全部体位/样貌/角色/剧情
      { text: '体位', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=&sort=1' },
      { text: '样貌', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=&sort=1' },
      { text: '角色', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=&sort=1' },
      { text: '剧情', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=&sort=1' },
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
