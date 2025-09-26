export default class MaiyouxJson {
  getConfig() {
    return {
      id: 'maiyoux-json',
      name: 'MaiYoux直播',
      api: 'http://api.maiyoux.com:81/mf/json.txt',
      nsfw: false,
      type: 1
    }
  }

  // 读取索引
  async _fetchIndex() {
    const indexUrl = 'http://api.maiyoux.com:81/mf/json.txt'
    const text = await req(indexUrl)
    const data = JSON.parse(text || '{}')
    const base = indexUrl.replace(/json\.txt$/,'') // -> http://api.maiyoux.com:81/mf/
    const list = Array.isArray(data.pingtai) ? data.pingtai : []
    return { base, list }
  }

  // 读取平台子列表
  async _fetchPlatform(url) {
    const text = await req(url)
    let data = null
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
    if (!data) return []
    // 容忍多种结构：数组或对象内数组
    const arr =
      Array.isArray(data) ? data :
      Array.isArray(data.list) ? data.list :
      Array.isArray(data.data) ? data.data :
      []
    return arr
  }

  async getCategory() {
    const { base, list } = await this._fetchIndex()
    return list.map(item => {
      const addr = (item.address || '').trim()
      const id = base + addr
      return { text: item.title || addr || '未命名', id }
    })
  }

  async getHome() {
    const cate = env.get('category') // 若为空，展示平台索引作为首页
    const page = env.get('page') || 1

    if (!cate) {
      const { base, list } = await this._fetchIndex()
      return list.map(item => {
        const addr = (item.address || '').trim()
        const id = base + addr
        const title = (item.title || '未命名').trim()
        const cover = item.xinimg || ''
        const remark = (item.Number || '').toString()
        return { id, title, cover, desc: '', remark, playlist: [] }
      })
    }

    // 分类已选：加载对应平台子列表
    const url = cate
    const arr = await this._fetchPlatform(url)

    // 分页（如需）
    const size = 60
    const start = (page - 1) * size
    const slice = arr.slice(start, start + size)

    return slice.map(row => {
      // 兼容字段名：title/name/text
      const title =
        (row.title || row.name || row.text || '未命名').toString().trim()
      // 兼容封面：img/cover/thumb/pic/logo
      const cover =
        row.img || row.cover || row.thumb || row.pic || row.logo || ''
      // 兼容播放链接：url/play/stream/m3u8/link
      const play =
        row.url || row.play || row.stream || row.m3u8 || row.link || ''

      // 兼容详情 id：href/id/path
      const id =
        row.href || row.id || row.path || play || ''

      const playlist = [{
        title: '默认',
        videos: play ? [{ text: '在线播放', url: play }] : []
      }]

      return { id, title, cover, desc: '', remark: '', playlist }
    })
  }

  async getDetail() {
    // 该源通常直接在列表里给出可播放链接，详情页仅做兜底
    const id = env.get('movieId') || ''
    const title = '详情'
    const cover = ''
    const desc = '此源多为直链播放，详情仅作占位'
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

    // 在索引层搜索平台
    const { base, list } = await this._fetchIndex()
    const matchedPlatforms = list
      .filter(it => (it.title || '').toLowerCase().includes(wd))
      .map(it => {
        const id = base + (it.address || '')
        return {
          id,
          title: it.title || '未命名',
          cover: it.xinimg || '',
          desc: '',
          remark: (it.Number || '').toString(),
          playlist: []
        }
      })

    // 深入平台内搜索（合并结果）
    const deepResults = []
    for (const it of list) {
      const platUrl = base + (it.address || '')
      const arr = await this._fetchPlatform(platUrl)
      const size = 60
      const start = (page - 1) * size
      const slice = arr.slice(start, start + size)
      for (const row of slice) {
        const title =
          (row.title || row.name || row.text || '').toString()
        if (!title) continue
        if (title.toLowerCase().includes(wd)) {
          const cover =
            row.img || row.cover || row.thumb || row.pic || row.logo || ''
          const play =
            row.url || row.play || row.stream || row.m3u8 || row.link || ''
          const id =
            row.href || row.id || row.path || play || platUrl
          deepResults.push({
            id, title, cover, desc: '', remark: it.title || '', playlist: [{
              title: '默认',
              videos: play ? [{ text: '在线播放', url: play }] : []
            }]
          })
        }
      }
    }

    return [...matchedPlatforms, ...deepResults]
  }
}
