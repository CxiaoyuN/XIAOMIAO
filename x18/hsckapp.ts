// import { kitty, req, createTestEnv } from "utils"

export default class HsckApp implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "hsck.app",
      name: "黄色仓库",
      // TODO(d1y): 上游需要支持动态获取域名
      api: "http://6613ck.cc",
      type: 1,
      nsfw: true,
      extra: {
        gfw: false,
        searchLimit: 36,
      }
    }
  }
  async getCategory() {
    return [
      {
        "id": "1",
        "text": "日韩AV"
      },
      {
        "id": "2",
        "text": "国产系列"
      },
      {
        "id": "3",
        "text": "欧美"
      },
      {
        "id": "4",
        "text": "成人动漫"
      },
      {
        "id": "8",
        "text": "无码中文字幕"
      },
      {
        "id": "9",
        "text": "有码中文字幕"
      },
      {
        "id": "10",
        "text": "日本无码"
      },
      {
        "id": "7",
        "text": "日本有码"
      },
      {
        "id": "15",
        "text": "国产视频"
      },
      {
        "id": "21",
        "text": "欧美高清"
      },
      {
        "id": "22",
        "text": "动漫剧情"
      }
    ]
  }

  async getHome() {
    const cate = env.get("category")
    const page = env.get("page")
    const url = `${env.baseUrl}/vodtype/${cate}-${page}.html`
    const $ = kitty.load(await req(url))
    return $(".stui-vodlist.clearfix li").toArray().map<IMovie | null>(item=> {
      const a = $(item).find("a")
      const id = a.attr("href") ?? ""
      if (!id.startsWith("/")) return null
      const title = a.attr("title") ?? ""
      const cover = a.attr("data-original") ?? ""
      return <IMovie>{ id, title, cover }
    }).filter(item=> !!item)
  }
  async getDetail() {
    const id = env.get("movieId")
    const url = `${env.baseUrl}${id}`
    const html = await req(url)
    const m3u8 = kitty.utils.getM3u8WithStr(html)
    return <IMovie>{
      playlist: [{
        title: "黄色仓库",
        videos: [{
          text: "播放",
          url: m3u8,
        }]
      }]
    }
  }
  async getSearch() {
    const wd = env.get("keyword")
    const page = env.get("page")
    const url = `${env.baseUrl}/vodsearch/${wd}----------${page}---.html`
    const $ = kitty.load(await req(url))
    return $(".stui-vodlist.clearfix li").toArray().map<IMovie | null>(item=> {
      const a = $(item).find("a")
      const id = a.attr("href") ?? ""
      if (!id.startsWith("/")) return null
      const title = a.attr("title") ?? ""
      const cover = a.attr("data-original") ?? ""
      return <IMovie>{ id, title, cover }
    }).filter(item=> !!item)
  }
}

// TEST
// const env = createTestEnv("http://6613ck.cc")
// const call = new HsckApp();
// (async ()=> {
//   const cates = await call.getCategory()
//   env.set("category", cates[0].id)
//   env.set("page", 1)
//   const home = await call.getHome()
//   env.set("keyword", "黑丝")
//   const search = await call.getSearch()
//   env.set("movieId", search[0].id)
//   const detail = await call.getDetail()
//   debugger
// })()
