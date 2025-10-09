// import { kitty, req, createTestEnv } from "utils"

export default class Re18jTV implements Handle {
  getConfig() {
    return <Iconfig>{
      id: '18jtv$',
      name: '18禁',
      api: "https://18j.tv",
      type: 1,
      nsfw: true,
      extra: {
        gfw: false,
        searchLimit: 16,
      }
    }
  }
  async getCategory() {
    return [
      {
        "text": "国产",
        "id": "1"
      },
      {
        "text": "日韩",
        "id": "2"
      },
      {
        "text": "欧美",
        "id": "3"
      },
      {
        "text": "伦理",
        "id": "4"
      },
      {
        "text": "动漫",
        "id": "16"
      },
      {
        "text": "另类",
        "id": "39"
      }
    ]
  }
  async getHome() {
    const cate = env.get("category")
    const page = env.get("page")
    const url = `${env.baseUrl}/t/${cate}-${page}/`
    const $ = kitty.load(await req(url))
    return $("ul.list li").toArray().map<IMovie>(item=>{
      const a = $(item).find("a")
      const title = a.attr("title") ?? ""
      const id = a.attr("href") ?? ""
      const cover = a.find("img").attr("data-original") ?? ""
      const remark = a.find("span").text().trim()
      return { id, title, cover, remark }
    })
  }
  async getDetail() {
    const id = env.get("movieId")
    const url = `${env.baseUrl}${id}`
    const html = await req(url)
    const m3u8 = html.match(/([^']+\.m3u8)/)![1]
    return <IMovie>{ playlist: [{
      title: "默认",
      videos: [{
        text: "播放",
        url: m3u8
      }]
    }] }
  }
  async getSearch() {
    const wd = env.get("keyword")
    const page = env.get("page")
    const url = `${env.baseUrl}/s/page/${page}/wd/${wd}/`
    const $ = kitty.load(await req(url))
    return $("ul.list li").toArray().map<IMovie>(item=>{
      const a = $(item).find("a")
      const title = a.attr("title") ?? ""
      const id = a.attr("href") ?? ""
      const cover = a.find("img").attr("data-original") ?? ""
      const remark = a.find("span").text().trim()
      return { id, title, cover, remark }
    })
  }
}

// TEST
// const env = createTestEnv("https://18j.tv")
// const call = new Re18jTV();
// (async ()=> {
//   const cates = await call.getCategory()
//   env.set("category", cates[0].id)
//   env.set("page", "1")
//   const home = await call.getHome()
//   env.set("keyword", "黑丝")
//   const search = await call.getSearch()
//   env.set("movieId", search[0].id)
//   const detail = await call.getDetail()
//   debugger
// })()
