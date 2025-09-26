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

  // 一级分类：从 json.txt 读取
  async getCategory() {
    try {
      const res = await req(`${env.api}/json.txt`)
      const json = JSON.parse(res.data || res)

      return json.map<ICategory>((item: any) => {
        return {
          text: item.title || '未命名分类',
          id: item.address || '',   // 直接用 address 作为分类 id
          cover: item.xinimg || ''
        }
      })
    } catch (err: any) {
      return <ICategory[]>[
        { text: `加载分类失败: ${err.message}`, id: 'error' }
      ]
    }
  }

  // 分类下的频道列表
  async getHome() {
    const cate = env.get<string>('category') || ''
    if (!cate) return []

    try {
      const res = await req(`${env.api}/${cate}`)
      const json = JSON.parse(res.data || res)
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
    } catch (err: any) {
      return [{
        id: 'error',
        title: `加载频道失败: ${err.message}`,
        cover: '',
        desc: '',
        remark: '',
        playlist: []
      }]
    }
  }

  // 详情页：直接返回播放地址
  async getDetail() {
    try {
      const id = env.get<string>('movieId')
      if (!id) throw new Error('缺少播放地址')

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
    } catch (err: any) {
      return <IMovie>{
        id: 'error',
        title: '错误',
        cover: '',
        desc: `加载详情失败: ${err.message}`,
        playlist: []
      }
    }
  }

  // 搜索：跨分类模糊匹配频道名
  async getSearch() {
    const keyword = env.get<string>('keyword')?.toLowerCase() || ''
    if (!keyword) return []

    try {
      const res = await req(`${env.api}/json.txt`)
      const mainJson = JSON.parse(res.data || res)
      const results: IMovie[] = []

      for (const cate of mainJson) {
        const file = cate.address
        if (!file) continue

        const subRes = await req(`${env.api}/${file}`)
        const subJson = JSON.parse(subRes.data || subRes)
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
    } catch (err: any) {
      return [{
        id: 'error',
        title: `搜索失败: ${err.message}`,
        cover: '',
        desc: '',
        remark: '',
        playlist: []
      }]
    }
  }
}
