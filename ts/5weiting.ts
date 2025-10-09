export default class LiuYueTingShu implements Handle {
  getConfig() {
    return {
      id: '5weiting',
      name: '六月听书网',
      api: 'http://www.5weiting.com',
      type: 3,
      nsfw: false
    }
  }

  async getCategory() {
    return [
      { id: 't1', text: '玄幻奇幻' },
      { id: 't28', text: '都市言情' },
      { id: 't2', text: '修真武侠' },
      { id: 't3', text: '恐怖灵异' },
      { id: 't4', text: '古今言情' },
      { id: 't5', text: '穿越重生' },
      { id: 't8', text: '评书' },
      { id: 't12', text: '历史' },
      { id: 't13', text: '军事' },
      { id: 't6', text: '粤语' },
      { id: 't14', text: '悬疑推理' },
      { id: 't16', text: '儿童读物' },
      { id: 't17', text: '广播剧' }
    ]
  }

  async getHome() {
    const cate = env.get('category') || 't2'
    const page = env.get('page') || '1'
    const url = `${env.baseUrl}/ys/${cate}/o1/p${page}`
    const html = await req(url)
    const $ = kitty.load(html)
    const list = []

    $('.album-list .album-item').each((_, el) => {
      const title = $(el).find('.book-item-name a').text().trim()
      const cover = $(el).find('.book-item-img img').attr('src')
      const url = $(el).find('.book-item-name a').attr('href')
      const desc = $(el).find('.book-item-desc').text().trim()
      list.push({ title, cover, url, desc })
    })

    return { list }
  }

  async getSearch() {
    const keyword = env.get('keyword')
    const html = await req(`${env.baseUrl}/search/${encodeURIComponent(keyword)}/1`)
    const $ = kitty.load(html)
    const list = []

    $('.album-list .album-item').each((_, el) => {
      const title = $(el).find('.book-item-name a').text().trim()
      const cover = $(el).find('.book-item-img img').attr('src')
      const url = $(el).find('.book-item-name a').attr('href')
      const desc = $(el).find('.book-item-desc').text().trim()
      list.push({ title, cover, url, desc })
    })

    return { list }
  }

  async getDetail() {
    const url = env.get('url')
    const html = await req(`${env.baseUrl}${url}`)
    const $ = kitty.load(html)
    const title = $('.book-item-name a').text().trim()
    const cover = $('.book-item-img img').attr('src')
    const desc = $('.book-item-desc').text().trim()
    const episodes = []

    $('.play-list ul.list li a').each((_, el) => {
      const name = $(el).text().trim()
      const href = $(el).attr('href')
      episodes.push({ name, url: href })
    })

    return { title, cover, desc, episodes }
  }

  async parseIframe() {
    const url = env.get('url')
    const html = await req(`${env.baseUrl}${url}`)
    const $ = kitty.load(html)
    const iframeSrc = $('iframe').attr('src')
    return { url: iframeSrc }
  }
}
