export default class MaiYouX implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'maiyoux',
      name: 'MaiYouX直播源',
      api: 'http://api.maiyoux.com:81/mf',
      nsfw: true,
      type: 1,
    }
  }

  // 一级分类
  async getCategory() {
    const url = `${env.api}/json.txt`
    const json = await req(url).then(res => JSON.parse(res))

    return json.map<ICategory>((item: any) => {
      const id = item.address?.replace(/\.txt$/, '') || ''
      return {
        text: item.title || '未命名分类',
        id,
        cover: item.xinimg || ''
      }
    })
  }

  // 分类下的频道列表
  async getHome() {
    const cate = env.get<string>('category') || ''
    if (!cate) return []

    const url = `${env.api}/${cate}.txt`
    const json = await req(url).then(res => JSON.parse(res))
    const list = json.zhubo || []

    return list.map<IMovie>((item: any) => ({
      id: item.address || '',
      title: item.title || '未命名频道',
      cover: item.img || '',
      desc: '',
      remark: '',
      playlist: [{
        title: '直播',
        videos: [{ text: '播放', id: item.address }]
      }]
    }))
  }

  // 详情页（直接播放）
  async getDetail() {
    const id = env.get<string>('movieId')
    return <IMovie>{
      id,
      title: '直播频道',
      cover: '',
      desc: '点击播放进入直播',
      playlist: [{
        title: '直播',
        videos: [{ text: '播放', id }]
      }]
    }
  }

  // 搜索（跨分类）
  async getSearch() {
    const keyword = env.get<string>('keyword')?.toLowerCase() || ''
    const mainJson = await req(`${env.api}/json.txt`).then(res => JSON.parse(res))

    const results: IMovie[] = []

    for (const cate of mainJson) {
      const file = cate.address
      if (!file) continue

      const subJson = await req(`${env.api}/${file}`).then(res => JSON.parse(res))
      const list = subJson.zhubo || []

      for (const item of list) {
        const text = `${item.title || ''}`.toLowerCase()
        if (text.includes(keyword)) {
          results.push({
            id: item.address || '',
            title: item.title || '未命名频道',
            cover: item.img || '',
            desc: '',
            remark: cate.title || '',
            playlist: [{
              title: '直播',
              videos: [{ text: '播放', id: item.address }]
            }]
          })
        }
      }
    }

    return results
  }
}
