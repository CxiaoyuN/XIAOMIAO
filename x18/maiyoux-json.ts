export default class MaiYouXJson implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'maiyoux-json',
      name: 'MaiYouX直播频道',
      api: 'http://api.maiyoux.com:81/mf/jsonweishizhibo.txt',
      nsfw: false,
      type: 3, // 类型3表示远程 JSON 源
    }
  }

  async getHome() {
    const json = await req(env.api).then(res => JSON.parse(res))
    const list = json.zhubo || []

    return list.map<IMovie>((item: any) => {
      return {
        id: item.address || '',
        title: item.title || '未命名频道',
        cover: item.img || '',
        desc: '',
        remark: '',
        playlist: [{
          title: '直播',
          videos: [{ text: '播放', id: item.address }]
        }]
      }
    })
  }

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

  async getSearch() {
    const keyword = env.get<string>('keyword')?.toLowerCase() || ''
    const json = await req(env.api).then(res => JSON.parse(res))
    const list = json.zhubo || []

    return list.filter((item: any) => {
      const text = `${item.title || ''}`.toLowerCase()
      return text.includes(keyword)
    }).map<IMovie>((item: any) => {
      return {
        id: item.address || '',
        title: item.title || '未命名频道',
        cover: item.img || '',
        desc: '',
        remark: '',
        playlist: [{
          title: '直播',
          videos: [{ text: '播放', id: item.address }]
        }]
      }
    })
  }
}
