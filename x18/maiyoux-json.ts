export default class Maiyoux implements Handle {
  getConfig() {
    return {
      id: 'maiyoux',
      name: 'Maiyoux聚合',
      api: 'http://api.maiyoux.com:81/mf/json.txt',
      nsfw: true,
      type: 1,
    }
  }

  // 缓存索引
  private cateList: any = {}

  async _fetchIndex() {
    const url = 'http://api.maiyoux.com:81/mf/json.txt'
    const text = await req(url)
    let data = {}
    try {
      data = JSON.parse(text)
    } catch {
      data = {}
    }
    this.cateList = data
    return data
  }

  async getCategory() {
    if (!this.cateList || Object.keys(this.cateList).length === 0) {
      await this._fetchIndex()
    }
    return Object.keys(this.cateList).map(key => ({
      text: key,
      id: key,
    }))
  }

  async getHome() {
    if (!this.cateList || Object.keys(this.cateList).length === 0) {
      await this._fetchIndex()
    }
    // 默认展示第一个分类
    const firstKey = Object.keys(this.cateList)[0]
    const list = this.cateList[firstKey] || []
    return list.map((item: any) => {
      return {
        id: item.address,
        title: item.title,
        cover: item.xinimg,
        desc: '',
        remark: item.Number?.toString() || '',
        playlist: [],
      }
    })
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const url = 'http://api.maiyoux.com:81/mf/' + id
    const text = await req(url)
    let data = {}
    try {
      data = JSON.parse(text)
    } catch {
      data = {}
    }
    const arr = (data as any).zhubo || []
    const videos = arr.map((it: any) => ({
      text: it.title,
      url: it.address,
    }))
    const playlist = [{ title: 'Leospring', videos }]
    return {
      id,
      title: '详情',
      cover: '',
      desc: '作者：Leospring 公众号：蚂蚁科技杂谈',
      playlist,
    }
  }

  async getSearch() {
    // 这个源没有搜索，只返回空
    return []
  }
}
