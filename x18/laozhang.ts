// import { kitty, req, createTestEnv } from "utils"

export default class Laozhang implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "laozhang_web",
      name: "老张资源(小猫专属)",
      // TODO(d1y): 上游需要支持动态获取 baseUrl
      api: "https://618017.xyz",
      nsfw: true,
      type: 1,
      extra: {
        gfw: false,
        searchLimit: 20,
      }
    }
  }

  async getCategory() {
    return [
      {
        "text": "全部视频",
        "id": "1"
      },
      {
        "text": "香蕉精品",
        "id": "13"
      },
      {
        "text": "制服诱惑",
        "id": "22"
      },
      {
        "text": "国产视频",
        "id": "6"
      },
      {
        "text": "清纯少女",
        "id": "8"
      },
      {
        "text": "辣妹大奶",
        "id": "9"
      },
      {
        "text": "女同专属",
        "id": "10"
      },
      {
        "text": "素人出演",
        "id": "11"
      },
      {
        "text": "角色扮演",
        "id": "12"
      },
      {
        "text": "人妻熟女",
        "id": "20"
      },
      {
        "text": "日韩剧情",
        "id": "23"
      },
      {
        "text": "经典伦理",
        "id": "21"
      },
      {
        "text": "成人动漫",
        "id": "7"
      },
      {
        "text": "精品二区",
        "id": "14"
      },
      {
        "text": "精品三区",
        "id": "40"
      },
      {
        "text": "动漫中字",
        "id": "53"
      },
      {
        "text": "日本无码",
        "id": "52"
      },
      {
        "text": "中文字幕",
        "id": "33"
      },
      {
        "text": "国产传媒",
        "id": "44"
      },
      {
        "text": "国产自拍",
        "id": "32"
      }
    ]
  }

  async getHome() {
    const cate = env.get('category')
    const page = env.get('page')
    const url = `${env.baseUrl}/index.php/vod/type/id/${cate}/page/${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)
    function decrypt(str: string): string {
      return Array.from(str, char => String.fromCharCode(128 ^ char.charCodeAt(0))).join('');
    }
    return $(".wrap a.vodbox").toArray().map<IMovie>(item=> {
      const id = $(item).attr("href") 
      const cover = $(item).find("img").attr("data-original")
      let title = $(item).find(".km-script").text()
      title = decrypt(title)
      return <IMovie>{ id, title, cover }
    })
  }

  async getDetail() {
    const id = env.get<string>("movieId")
    function getUrlQueryString(url: string) {
      const startIdx = url.indexOf("?")
      if (startIdx <= -1) return null
      const qs = url.substring(startIdx + 1)
      const params = qs.split("&")
      const result: Record<string, any> = {}
      for (const param of params) {
        const [key, value] = param.split("=")
        result[key] = value
      }
      return {
        ...result,
        get(key: string, defualtValue = ""): any {
          return result[key] ?? defualtValue
        }
      }
    }
    const params = getUrlQueryString(id)
    if (!params) return {} as any
    let video = params.get("v") || ""
    const mid = params.get("m") || ""
    if (mid) {
      const _ = await req(`https://h5.xxoo168.org/api/v2/vod/reqplay/${mid}`)
      const cx: {
        data: {
          xxx_api_auth: string
          httpurl: string
          httpurls: Array<{
            hdtype: string
            httpurl: string
          }>
        }
      } = JSON.parse(_)
      video = cx.data.httpurl
    }
    return <IMovie>{
      playlist: [{
        title: "默认",
        videos: [{
          text: "播放",
          url: video,
        }]
      }]
    }
  }

  async getSearch() {
    const wd = env.get<string>("keyword")
    const page = env.get<string>("page")
    const url = `${env.baseUrl}/index.php/vod/type/id/3/wd/${wd}/page/${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)
    function decrypt(str: string): string {
      return Array.from(str, char => String.fromCharCode(128 ^ char.charCodeAt(0))).join('');
    }
    return $(".wrap a.vodbox").toArray().map<IMovie>(item=> {
      const id = $(item).attr("href") 
      const cover = $(item).find("img").attr("data-original")
      let title = $(item).find(".km-script").text()
      title = decrypt(title)
      return <IMovie>{ id, title, cover }
    })
  }
}

// TEST
// const env = createTestEnv("https://618017.xyz")
// const call = new Laozhang();
// (async ()=> {
//   const cates = await call.getCategory()
//   env.set("category", cates[0].id)
//   env.set("page", 1)
//   const home = await call.getHome()
//   env.set("keyword", "黑丝")
//   const search = await call.getSearch()
//   env.set("movieId", home[0].id)
//   const detail = await call.getDetail()
//   debugger
// })()
