export default class WuWeiTing implements Handle {
  getConfig() {
    return {
      id: '5weiting',
      name: '六月听书',
      type: 1,
      api: 'http://www.5weiting.com',
      nsfw: false
    }
  }

  async getCategory() {
    return [
      { text: '玄幻武侠', id: '1' },
      { text: '都市言情', id: '2' },
      { text: '历史军事', id: '3' },
      { text: '恐怖悬疑', id: '4' },
      { text: '网络游戏', id: '5' }
    ]
  }

  async getHome() {
    const html = await req(`${env.baseUrl}/list/1`)
    const $ = kitty.load(html)
    const result = $('.book .bookinfo').toArray().map(item => {
      const title = $(item).find('h4 a').text()
      const id = $(item).find('h4 a').attr('href') ?? ''
      const cover = $(item).find('img').attr('src') ?? ''
      const remark = $(item).find('.author').text()
      return { id, title, cover, desc: '', remark, playlist: [] }
    })
    return result
  }

  async getDetail() {
    const id = env.get('movieId')
    const html = await req(`${env.baseUrl}${id}`)
    const $ = kitty.load(html)
    const title = $('h1').text()
    const cover = $('.bookimg img').attr('src') ?? ''
    const remark = $('.bookinfo .author').text()
    const playlist = [{
      title: '默认',
      videos: $('.playlist li a').toArray().map(a => {
        const text = $(a).text()
        const url = $(a).attr('href') ?? ''
        return { text, url, type: 'iframe' }
      })
    }]
    return { id, title, cover, remark, desc: '', playlist }
  }

  async parseIframe() {
    const iframe = env.get('iframe')
    const html = await req(`${env.baseUrl}${iframe}`)
    const match = html.match(/"(http:\/\/61\.160\.194\.89:20001\/[^"]+\.mp3[^"]*)"/)
    if (match) {
      return { type: 'm3u8', url: match[1] }
    }
    return null
  }

  async getSearch() {
    const keyword = env.get('keyword')
    const html = await req(`${env.baseUrl}/search?searchword=${encodeURIComponent(keyword)}`)
    const $ = kitty.load(html)
    const result = $('.book .bookinfo').toArray().map(item => {
      const title = $(item).find('h4 a').text()
      const id = $(item).find('h4 a').attr('href') ?? ''
      const cover = $(item).find('img').attr('src') ?? ''
      const remark = $(item).find('.author').text()
      return { id, title, cover, desc: '', remark, playlist: [] }
    })
    return result
  }
}
