// import { kitty, req, createTestEnv } from "utils"

export default class Re18xxx implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "18xxx$",
      name: "18xxx",
      type: 1,
      nsfw: true,
      api: "https://www.18xxx6.hair",
      extra: {
        gfw: false,
        searchLimit: 21,
      }
    }
  }
  async getCategory() {
    return [
      {
        "id": "20",
        "text": "绝美少女"
      },
      {
        "id": "21",
        "text": "激情口交"
      },
      {
        "id": "22",
        "text": "同性专区"
      },
      {
        "id": "23",
        "text": "人妖激情"
      },
      {
        "id": "24",
        "text": "重咸口味"
      },
      {
        "id": "25",
        "text": "国产专区"
      },
      {
        "id": "26",
        "text": "日韩专区"
      },
      {
        "id": "27",
        "text": "欧美专区"
      },
      {
        "id": "28",
        "text": "卡通动漫"
      },
      {
        "id": "29",
        "text": "三级伦理"
      }
    ]
  }
  async getHome() {
    const cate = env.get("category")
    const page = env.get("page")
    const url = `${env.baseUrl}/cn/home/web/index.php/vod/type/id/${cate}/page/${page}.html`
    const $ = kitty.load(await req(url))
    return $(".watchlist .ng-scope").toArray().map<IMovie>(item=> {
      const title = $(item).find(".title").text().trim()
      const id = $(item).find("a").attr("href") ?? ""
      const cover = $(item).find("img").attr("data-original") ?? ""
      return <IMovie>{ title, id, cover }
    })
  }
  async getDetail() {
    const id = env.get("movieId")
    const url = `${env.baseUrl}${id}`
    const html = await req(url)
    const m3u8 = kitty.utils.getM3u8WithStr(html)
    return <IMovie>{ playlist: [{
      title: "默认",
      videos: [
        { text: "播放", url: m3u8, }
      ]
    }]}
  }
  async getSearch() {
    const wd = env.get("keyword")
    const page = env.get("page")
    const url = `${env.baseUrl}/cn/home/web/index.php/vod/search/page/${page}/wd/${wd}.html`
    const $ = kitty.load(await req(url))
    return $(".watchlist .ng-scope").toArray().map<IMovie>(item=> {
      const title = $(item).find(".title").text().trim()
      const id = $(item).find("a").attr("href") ?? ""
      const cover = $(item).find("img").attr("data-original") ?? ""
      return <IMovie>{ title, id, cover }
    })
  }
}

// TEST
// const env = createTestEnv("https://www.18xxx6.hair")
// const call = new Re18xxx();
// (async ()=> {
//   const cates = await call.getCategory()
//   env.set("category", cates[0].id)
//   env.set("page", 1)
//   const home = await call.getHome()
//   env.set("keyword", "黑丝")
//   env.set("page", 2)
//   const search = await call.getSearch()
//   env.set("movieId", search[0].id)
//   const detail = await call.getDetail()
//   debugger
// })()