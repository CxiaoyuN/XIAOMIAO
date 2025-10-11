export default class XM618514 implements Handle {
  getConfig() {
    return {
      id: 'xm618514',
      name: '黄集资源',
      api: 'https://618514.xyz',
      type: 1,
      nsfw: true
    }
  }

  async getCategory() {
    return [
      { id: '40', text: '无码' },
      { id: '39', text: '字幕' },
      { id: '37', text: '网黄' },
      { id: '36', text: '传媒' },
      { id: '38', text: '国产' },
      { id: '41', text: '推荐' },
      { id: '28', text: '动漫' },
      { id: '29', text: 'OnlyF' },
      { id: '33', text: '无码2' },
      { id: '30', text: 'FC2' },
      { id: '27', text: '字幕2' },
      { id: '26', text: '国产2' }
    ]
  }

  async getHome() {
    const cate = env.get('category')
    const page = env.get('page') || 1
    const url = `${env.baseUrl}/index.php/vod/type/id/${cate}/page/${page}.html`
    const html = await req(url)

    const matches = html.matchAll(/<a[^>]*class="vodbox"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<img[^>]*data-cover="([^"]+)"[^>]*>[\s\S]*?<p[^>]*class="km-script"[^>]*>([^<]+)<\/p>/g)

    const result = []
    for (const match of matches) {
      const relative = match[1]
      const cover = match[2]
      const title = match[3].trim()

      // 提取播放地址
      const playMatch = relative.match(/v=([^&]+)/)
      const playUrl = playMatch ? decodeURIComponent(playMatch[1]) : `${env.baseUrl}${relative}`

      result.push({
        id: relative,
        title,
        cover,
        desc: '',
        remark: '',
        playlist: [{
          name: '在线播放',
          urls: [{ name: '立即播放', id: playUrl }]
        }]
      })
    }

    return result
  }

  async getSearch() {
    const keyword = env.get('keyword')
    const page = env.get('page') || 1
    const url = `${env.baseUrl}/index.php/vod/search/page/${page}/wd/${encodeURIComponent(keyword)}.html`
    const html = await req(url)

    const matches = html.matchAll(/<a[^>]*class="vodbox"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<img[^>]*data-cover="([^"]+)"[^>]*>[\s\S]*?<p[^>]*class="km-script"[^>]*>([^<]+)<\/p>/g)

    const result = []
    for (const match of matches) {
      const relative = match[1]
      const cover = match[2]
      const title = match[3].trim()

      const playMatch = relative.match(/v=([^&]+)/)
      const playUrl = playMatch ? decodeURIComponent(playMatch[1]) : `${env.baseUrl}${relative}`

      result.push({
        id: relative,
        title,
        cover,
        desc: '',
        remark: '',
        playlist: [{
          name: '在线播放',
          urls: [{ name: '立即播放', id: playUrl }]
        }]
      })
    }

    return result
  }

  async getDetail() {
    const id = env.get('movieId')
    const playMatch = id.match(/v=([^&]+)/)
    const playUrl = playMatch ? decodeURIComponent(playMatch[1]) : `${env.baseUrl}${id}`

    return {
      id,
      title: '在线播放',
      cover: '',
      desc: '',
      remark: '',
      playlist: [{
        name: '在线播放',
        urls: [{ name: '立即播放', id: playUrl }]
      }]
    }
  }

  async parseIframe() {
    return ''
  }
}
