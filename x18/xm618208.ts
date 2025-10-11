export default class XM6181035 implements Handle {
  getConfig() {
    return {
      id: 'xm6181035',
      name: '黄集资源',
      api: 'https://6181035.xyz',
      type: 1,
      nsfw: true
    }
  }

  async getCategory() {
    return [
      { id: '13', text: '香蕉' },
      { id: '22', text: '制服' },
      { id: '6', text: '国产' },
      { id: '8', text: '少女' },
      { id: '9', text: '辣妹' },
      { id: '10', text: '女同' },
      { id: '11', text: '素人' },
      { id: '12', text: '角色' },
      { id: '20', text: '人妻' },
      { id: '23', text: '日韩' },
      { id: '21', text: '伦理' },
      { id: '7', text: '动漫' },
      { id: '14', text: '二区' },
      { id: '40', text: '三区' },
      { id: '52', text: '无码' },
      { id: '33', text: '中文' },
      { id: '44', text: '传媒' },
      { id: '32', text: '自拍' }
    ]
  }

  async getHome() {
    const cate = env.get('category')
    const page = env.get('page')
    const url = `${env.baseUrl}/index.php/vod/type/id/${cate}/page/${page}.html`
    const html = await req(url)

    // 正则提取所有 vodbox 区块
    const matches = html.matchAll(/<a[^>]*class="vodbox"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<img[^>]*data-original="([^"]+)"[^>]*>[\s\S]*?<p[^>]*class="km-script"[^>]*>([^<]+)<\/p>/g)

    const result = []
    for (const match of matches) {
      const relative = match[1]
      const cover = match[2]
      const title = match[3].trim()
      const fullUrl = `${env.baseUrl}${relative}`

      result.push({
        id: relative,
        title,
        cover,
        desc: '',
        remark: '',
        playlist: [{
          name: '在线播放',
          urls: [{ name: '立即播放', id: fullUrl }]
        }]
      })
    }

    return result
  }

  async getSearch() {
    const cate = env.get('category') || '1'
    const keyword = env.get('keyword')
    const page = env.get('page') || 1
    const url = `${env.baseUrl}/index.php/vod/type/id/${cate}/wd/${encodeURIComponent(keyword)}/page/${page}.html`
    const html = await req(url)

    const matches = html.matchAll(/<a[^>]*class="vodbox"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<img[^>]*data-original="([^"]+)"[^>]*>[\s\S]*?<p[^>]*class="km-script"[^>]*>([^<]+)<\/p>/g)

    const result = []
    for (const match of matches) {
      const relative = match[1]
      const cover = match[2]
      const title = match[3].trim()
      const fullUrl = `${env.baseUrl}${relative}`

      result.push({
        id: relative,
        title,
        cover,
        desc: '',
        remark: '',
        playlist: [{
          name: '在线播放',
          urls: [{ name: '立即播放', id: fullUrl }]
        }]
      })
    }

    return result
  }

  async getDetail() {
    const id = env.get('movieId')
    const fullUrl = `${env.baseUrl}${id}`

    return {
      id,
      title: '在线播放',
      cover: '',
      desc: '',
      remark: '',
      playlist: [{
        name: '在线播放',
        urls: [{ name: '立即播放', id: fullUrl }]
      }]
    }
  }

  async parseIframe() {
    return ''
  }
}
