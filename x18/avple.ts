//import { kitty, req, env } from 'utils'

export default class avple implements Handle {
  getConfig() {
    return {
      id: 'avple',
      name: 'AVPLE',
      api: 'https://avple.tv',
      type: 1,
      nsfw: true
    }
  }

  async getCategory() {
    return [
      { text: '麻豆传媒', id: '121' },
      { text: '果冻传媒', id: '123' },
      { text: '皇家华人', id: '124' },
      { text: '精东影业', id: '125' },
      { text: '天美传媒', id: '126' },
      { text: '星空无限', id: '127' },
      { text: '乐博传媒', id: '128' },
      { text: '蜜桃传媒', id: '129' },
      { text: '乌鸦传媒', id: '130' },
      { text: '国产自拍', id: '131' },
      { text: 'SWAG', id: '132' },
      { text: 'FC2PPV', id: '135' }
    ]
  }

  async getHome() {
    const cate = env.get('category') || '121'
    const page = env.get('page') || '1'
    const url = `${env.baseUrl}/tags/${cate}/${page}/date`
    const html = await req(url)
    const $ = kitty.load(html)

    const script = $('script#__NEXT_DATA__').text()?.trim()
    if (!script) {
      console.warn('页面缺少 __NEXT_DATA__')
      return []
    }

    let unsafeObj
    try {
      unsafeObj = eval(`(${script})`)
    } catch (e) {
      console.warn('getHome eval 失败:', e)
      return []
    }

    const candidates = [
      unsafeObj?.props?.pageProps?.data,
      unsafeObj?.props?.pageProps?.videos,
      unsafeObj?.props?.pageProps?.list,
      unsafeObj?.props?.pageProps?.items
    ]
    const data = candidates.find(d => Array.isArray(d)) ?? []

    if (!data.length) {
      console.warn('未找到有效视频列表字段')
      return []
    }

    return data.map(item => ({
      id: item._id,
      title: item.title,
      cover: item.img_preview,
      remark: item.tags?.[0] ?? ''
    }))
  }

  async getDetail() {
    const id = env.get('movieId')
    const url = `${env.baseUrl}/video/${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const script = $('script#__NEXT_DATA__').text()?.trim()
    if (!script) throw new Error('页面缺少 __NEXT_DATA__')

    let unsafeObj
    try {
      unsafeObj = eval(`(${script})`)
    } catch (e) {
      throw new Error('getDetail eval 失败: ' + e)
    }

    const instance = unsafeObj?.props?.pageProps?.instance
    if (!instance?.play) throw new Error('未找到播放地址')

    const realM3u8 = this.getRealM3u8(instance.play_source_type, instance.play)

    return {
      id,
      title: instance.title,
      cover: instance.img_normal,
      desc: instance.key_words?.join(',') ?? '',
      playlist: [{
        title: 'avple',
        videos: [{
          text: instance.release,
          url: realM3u8
        }]
      }]
    }
  }

  getRealM3u8(type: number, m3u8: string): string {
    const full_domain = [
      'd862cp.cdnedge.live', 'q2cyl7.cdnedge.live', 'u89ey.cdnedge.live',
      'zo392.cdnedge.live', 'wo880.cdnedge.live', '6m7d.cdnedge.live',
      '8bb88.cdnedge.live', 'fa678.cdnedge.live', 'pg2z7.cdnedge.live',
      '1xp60.cdnedge.live', '47b61.cdnedge.live', 'i3qss.cdnedge.live',
      '10j99.cdnedge.live', 'je40u.cdnedge.live', 'f125c.cdnedge.live',
      'w9n76.cdnedge.live', 's6s6u.cdnedge.live', 'rup0u.cdnedge.live',
      'e2fa6.cdnedge.live', 't4tm6.cdnedge.live', 'w083g.cdnedge.live'
    ]
    const _domain = full_domain.map(e => e.split('.')[0] + '1.cdnedge.live')
    const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)]

    switch (type) {
      case 5: return `${env.baseUrl}/${m3u8}`
      case 7:
      case 8: return `https://${pick(full_domain)}/file/avple-images/${m3u8}`
      case 12: return `https://${pick(_domain)}/file/avple-asserts/${m3u8}`
      case 13: return `https://${pick(_domain)}/file/avple-asserts/${m3u8}`
      case 14: return `https://${pick(_domain)}/file/avple-asserts/${m3u8}`
      case 17:
      case 18: return `https://${pick(_domain)}/file/avple-asserts/${m3u8}`
      default: return `${env.baseUrl}/${m3u8}`
    }
  }

  async getSearch() {
    const wd = env.get('keyword')
    const page = env.get('page') || '1'
    const url = `${env.baseUrl}/search?key=${wd}&page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    const script = $('script#__NEXT_DATA__').text()?.trim()
    if (!script) {
      console.warn('搜索页缺少 __NEXT_DATA__')
      return []
    }

    let unsafeObj
    try {
      unsafeObj = eval(`(${script})`)
    } catch (e) {
      console.warn('getSearch eval 失败:', e)
      return []
    }

    const data = unsafeObj?.props?.pageProps?.data
    if (!Array.isArray(data)) {
      console.warn('搜索结果不是数组')
      return []
    }

    return data.map(item => ({
      id: item._id,
      title: item.title,
      cover: item.img_preview,
      remark: item.tags?.[0] ?? ''
    }))
  }
}
