// import { kitty, req } from 'utils'

export default class YHDM implements Handle {
  getConfig() {
    return {
      id: 'yhdm',
      name: '樱花动漫_测',
      api: 'https://www.857yhw.com',
      type: 1,
      nsfw: false,
    }
  }

  async getHome() {
    const cate = env.get('category')
    const page = env.get('page')
    const url = `${env.baseUrl}/type/${cate}-${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb')
      return {
        id: a.attr('href') ?? '',
        title: a.attr('title') ?? '',
        cover: a.attr('data-original') ?? '',
        remark: $(item).find('.pic-text').text().trim(),
        playlist: [],
      }
    })
  }

  async getDetail() {
    const id = env.get('movieId')
    const html = await req(`${env.baseUrl}${id}`)
    const $ = kitty.load(html)

    const title = $('.myui-content__detail .title').text().trim()
    const desc = $('.myui-content__detail .data').text().trim()
    const cover = $('.myui-content__thumb .lazyload').attr('data-original') ?? ''
    const remark = $('.myui-content__detail .myui-content__other').text().trim()

    // 提取 player_aaaa
    const scriptText = $('script')
      .map((i, el) => $(el).html())
      .get()
      .find(t => t && t.includes('var player_aaaa'))

    let player: any = {}
    if (scriptText) {
      const match = scriptText.match(/var player_aaaa\s*=\s*(\{.*?\});/)
      if (match) {
        player = JSON.parse(match[1])
      }
    }

    const playlists: IPlaylist[] = []
    const videos: IPlaylistVideo[] = []

    if (player.url) {
      const realUrl = `https://danmu.yhdmjx.com/m3u8.php?url=${player.url}`
      videos.push({ text: '第1集', id: realUrl })
    }

    if (videos.length > 0) {
      playlists.push({ title: '默认线路', videos })
    }

    return { id, title, cover, desc, remark, playlist: playlists }
  }

  async getSearch() {
    const wd = env.get('keyword')
    const page = env.get('page')
    const html = await req(`${env.baseUrl}/search/${wd}----------${page}---.html`)
    const $ = kitty.load(html)

    return $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb')
      return {
        id: a.attr('href') ?? '',
        title: a.attr('title') ?? '',
        cover: a.attr('data-original') ?? '',
        remark: $(item).find('.pic-text').text().trim(),
        playlist: [],
      }
    })
  }

  async parseIframe() {
    return env.get('id') // 直接返回完整 m3u8 地址
  }
}
