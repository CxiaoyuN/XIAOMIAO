export default class LiuYueTingShu implements Handle {
  getConfig() {
    return {
      id: '6weiting',
      name: '六月听书网',
      api: 'http://www.5weiting.com',
      type: 3,
      nsfw: false
    }
  }

  async getCategory() {
    return [
      { id: '1', text: '玄幻奇幻' },
      { id: '28', text: '都市言情' },
      { id: '2', text: '修真武侠' },
      { id: '3', text: '恐怖灵异' },
      { id: '4', text: '古今言情' },
      { id: '5', text: '穿越重生' },
      { id: '8', text: '评书' },
      { id: '12', text: '历史' },
      { id: '13', text: '军事' },
      { id: '6', text: '粤语' },
      { id: '14', text: '悬疑推理' },
      { id: '16', text: '儿童读物' },
      { id: '17', text: '广播剧' }
    ]
  }

  async getHome() {
    const cate = env.get('category') || '2'
    const page = env.get('page') || '1'
    const url = `${env.baseUrl}/ys/t${cate}/o1/p${page}`
    const html = await req(url)
    if (!html) return { list: [] }

    const $ = kitty.load(html)
    const list = []

    $('.album-list .album-item').each((_, el) => {
      const title = $(el).find('.book-item-name a').text().trim()
      const cover = $(el).find('.book-item-img img').attr('src') || ''
      const url = $(el).find('.book-item-name a').attr('href')
      const desc = $(el).find('.book-item-desc').text().trim()
      if (title && url) list.push({ title, cover, url, desc })
    })

    return { list }
  }

  async getSearch() {
    const keyword = env.get('keyword')
    const html = await req(`${env.baseUrl}/search/${encodeURIComponent(keyword)}/1`)
    if (!html) return { list: [] }

    const $ = kitty.load(html)
    const list = []

    $('.album-list .album-item').each((_, el) => {
      const title = $(el).find('.book-item-name a').text().trim()
      const cover = $(el).find('.book-item-img img').attr('src') || ''
      const url = $(el).find('.book-item-name a').attr('href')
      const desc = $(el).find('.book-item-desc').text().trim()
      if (title && url) list.push({ title, cover, url, desc })
    })

    return { list }
  }

  async getDetail() {
    const url = env.get('url')
    const html = await req(`${env.baseUrl}${url}`)
    if (!html) return { title: '未知', cover: '', desc: '', episodes: [] }

    const $ = kitty.load(html)
    const title = $('.book-item-name a').text().trim() || '未知标题'
    const cover = $('.book-item-img img').attr('src') || ''
    const desc = $('.book-item-desc').text().trim() || ''
    const episodes = []

    $('.play-list ul.list li a').each((_, el) => {
      const name = $(el).text().trim()
      const href = $(el).attr('href')
      if (name && href) episodes.push({ name, url: href })
    })

    return { title, cover, desc, episodes }
  }

  async parseIframe() {
    const url = env.get('url')
    const html = await req(`${env.baseUrl}${url}`)
    if (!html) return { url: '' }

    const $ = kitty.load(html)
    const iframeSrc = $('iframe').attr('src') || ''
    return { url: iframeSrc }
  }
}
