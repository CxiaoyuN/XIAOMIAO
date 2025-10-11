// import { kitty, req, createTestEnv } from "utils"

export default class RealXXX implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "real_xxxx",
      name: "一个纯粹的x站",
      type: 1,
      nsfw: true,
      api: "https://rtk.ygccdxz9.ink",
      extra: {
        gfw: false,
        searchLimit: 48,
      }
    }
  }
  async getCategory() {
    return [
      {
        "id": "20",
        "text": "亚洲情色"
      },
      {
        "id": "21",
        "text": "制服师生"
      },
      {
        "id": "22",
        "text": "卡通动漫"
      },
      {
        "id": "23",
        "text": "丝袜美腿"
      },
      {
        "id": "24",
        "text": "强奸乱伦"
      },
      {
        "id": "25",
        "text": "偷拍自拍"
      },
      {
        "id": "29",
        "text": "人妻熟女"
      },
      {
        "id": "30",
        "text": "无码专区"
      },
      {
        "id": "32",
        "text": "自淫系列"
      },
      {
        "id": "36",
        "text": "国产精品"
      },
      {
        "id": "33",
        "text": "拳交系列"
      },
      {
        "id": "28",
        "text": "欧美性爱"
      },
      {
        "id": "31",
        "text": "SM捆绑"
      },
      {
        "id": "35",
        "text": "男同女同"
      },
      {
        "id": "26",
        "text": "4K岛国"
      },
      {
        "id": "27",
        "text": "中文字幕"
      },
      {
        "id": "37",
        "text": "三级伦理"
      }
    ]
  }
  async getHome() {
    const cate = env.get("category")
    const page = env.get("page")
    const url = `${env.baseUrl}/cn/home/web/index.php/vod/type/id/${cate}/page/${page}.html`
    const $ = kitty.load(await req(url))
    return $(".detail_right_div ul li").toArray().map<IMovie>(item => {
      const img = $(item).find("img")
      const title = img.attr("title") ?? ""
      const cover = img.attr("src") ?? ""
      const id = $(item).find('a').attr("href") ?? ""
      const remark = $(item).find("i").text() ?? ""
      return { title, cover, id, remark }
    })
  }
  async getDetail() {
    const id = env.get("movieId")
    const url = `${env.baseUrl}${id}`
    const html = await req(url)
    const m3u8 = kitty.utils.getM3u8WithStr(html)
    return <IMovie>{
      playlist: [{
        title: "默认",
        videos: [
          { text: "播放", url: m3u8, }
        ]
      }]
    }
  }
  async getSearch() {
    const wd = env.get("keyword")
    const page = env.get("page")
    const url = `${env.baseUrl}/cn/home/web/index.php/vod/search/page/${page}/wd/${wd}.html`
    const $ = kitty.load(await req(url))
    return $(".detail_right_div ul li").toArray().map<IMovie>(item => {
      const img = $(item).find("img")
      const title = img.attr("title") ?? ""
      const cover = img.attr("src") ?? ""
      const id = $(item).find('a').attr("href") ?? ""
      const remark = $(item).find("i").text() ?? ""
      return { title, cover, id, remark }
    })
  }
}

// TEST
// const env = createTestEnv("https://rtk.ygccdxz9.ink")
// const call = new RealXXX();
// (async ()=> {
//   const cates = await call.getCategory()
//   env.set("category", cates[0].id)
//   env.set("page", 1)
//   const home = await call.getHome()
//   env.set("keyword", "黑丝")
//   env.set("page", 1)
//   const search = await call.getSearch()
//   env.set("movieId", search[0].id)
//   const detail = await call.getDetail()
//   debugger
// })()