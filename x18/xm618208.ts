export default class XM618208 implements Handle {
  getConfig() {
    return {
      id: 'xm618208',
      name: '黄集资源',
      api: 'https://618208.xyz',
      type: 1,
      nsfw: false
    }
  }

  async getCategory() {
    return [
      { id: '13', text: '香蕉精品' },
      { id: '22', text: '制服' },
      { id: '6', text: '国产' }
    ]
  }

  async getHome() {
    const cate = env.get('category')
    const page = env.get('page')
    const url = `${env.baseUrl}/index.php/vod/type/id/${cate}.html?page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.vodbox').toArray().map(el => {
      const id = $(el).attr('href') ?? ''
      const title = $(el).find('.km-script').text().trim()
      let cover = $(el).find('img.lazy').attr('data-original') ?? ''
      if (cover.startsWith('//')) cover = 'https:' + cover
      return { id, title, cover, desc: '', remark: '', playlist: [] }
    })
  }

  async getDetail() {
    const id = env.get('movieId')
    const url = `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('p.km-script').text().trim()
    const cover = $('img.lazy').attr('data-original') ?? ''
    const playlist = [{
      name: '播放',
      urls: [{ name: '播放地址', id }]
    }]

    return { id, title, cover, desc: '', remark: '', playlist }
  }

  async parseIframe() {
    const iframe = env.get('iframe')
    return kitty.utils.getM3u8WithIframe(env)
  }
}
