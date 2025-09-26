export default class Maiyoux {
  getConfig() {
    return {
      id: 'maiyoux',
      name: 'Maiyoux聚合',
      api: 'http://api.maiyoux.com:81/mf/json.txt',
      nsfw: false,
      type: 1,
    }
  }

  // 读取索引
  async _fetchIndex() {
    const indexUrl = 'http://api.maiyoux.com:81/mf/json.txt'
    const text = await req(indexUrl)
    let data = {}
    try {
      data = JSON.parse(text)
    } catch {
      data = {}
    }
    const base = indexUrl.replace(/json\.txt$/, '') // => http://api.maiyoux.com:81/mf/
    const list = Array.isArray(data.pingtai) ? data.pingtai : []
    return { base, list }
  }

  async getCategory() {
    const { base, list } = await this._fetchIndex()
    return list.map(item => {
      const addr = (item.address || '').trim()
      const id = base + addr
      // JSON.parse 已经会自动把 \uXXXX 转成中文
      const text = item.title || addr || '未命名'
      return { text, id }
    })
  }

  async getHome() {
    const cate = env.get('category')
    const page = env.get('page') || 1

    // 如果没有选择分类，就展示平台索引
    if (!cate) {
      const { base, list } = await this._fetchIndex()
      return list.map(item => {
        const addr = (item.address || '').trim()
        const id = base + addr
        const title = item.title || '未命名'
        const cover = item.xinimg || ''
        const remark = (item.Number || '').toString()
        return { id, title, cover, desc: '', remark, playlist: [] }
      })
    }

    // 已选择分类：加载对应的子 JSON
    const url = cate
    const text = await req(url)
    let data = {}
    try {
      data = JSON.parse(text)
    } catch {
      data = {}
    }
    const arr = data.zhubo || data.list || data.data || []

    // 分页
    const size = 60
    const start = (page - 1) * size
    const slice = arr.slice(start, start + size)

    return slice.map(row => {
      const title = (row.title || '').trim()
      const cover = row.img || ''
      const play = row.address || row.url || ''
      const id = play || ''
      const playlist = [{
        title: '默认',
        videos: play ? [{ text: '在线播放', url: play }] : []
      }]
      return { id, title, cover, desc: '', remark: '', playlist }
    })
  }

  async getDetail() {
    const id = env.get('movieId') || ''
    const title = '详情'
    const cover = ''
    const desc = '直链播放源'
    const playlist = [{
      title: '默认',
      videos: id && /^https?:/.test(id) ? [{ text: '在线播放', url: id }] : []
    }]
    return { id, title, cover, desc, playlist }
  }

  async getSearch() {
    const wd = (env.get('keyword') || '').toLowerCase()
    const page = env.get('page') || 1
    if (!wd) return []

    const { base, list } = await this._fetchIndex()
    const results = []

    for (const it of list) {
      const platUrl = base + (it.address || '')
      const text = await req(platUrl)
      let data = {}
      try {
        data = JSON.parse(text)
      } catch {
        data = {}
      }
      const arr = data.zhubo || data.list || data.data || []
      const size = 60
      const start = (page - 1) * size
      const slice = arr.slice(start, start + size)

      for (const row of slice) {
        const title = (row.title || '').toLowerCase()
        if (title.includes(wd)) {
          const cover = row.img || ''
          const play = row.address || row.url || ''
          const id = play || ''
          const playlist = [{
            title: '默认',
            videos: play ? [{ text: '在线播放', url: play }] : []
          }]
          results.push({
            id,
            title: row.title,
            cover,
            desc: '',
            remark: it.title || '',
            playlist
          })
        }
      }
    }
    return results
  }
}
