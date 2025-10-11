// import { kitty, req, createTestEnv } from "utils"

export default class GDD implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "gdd$",
      name: "GDD视频",
      type: 1,
      nsfw: true,
      api: "https://www.gdd5.quest",
      extra: {
        gfw: false,
        searchLimit: 20,
      }
    }
  }
  async getCategory() {
    return [
      {
        "id": "21",
        "text": "女神学生"
      },
      {
        "id": "22",
        "text": "美女直播"
      },
      {
        "id": "23",
        "text": "人妻系列"
      },
      {
        "id": "24",
        "text": "强奸乱伦"
      },
      {
        "id": "25",
        "text": "自拍偷拍"
      },
      {
        "id": "26",
        "text": "制服诱惑"
      },
      {
        "id": "27",
        "text": "巨乳系列"
      },
      {
        "id": "28",
        "text": "自慰系列"
      },
      {
        "id": "29",
        "text": "国产视频"
      },
      {
        "id": "30",
        "text": "无码视频"
      },
      {
        "id": "31",
        "text": "有码视频"
      },
      {
        "id": "32",
        "text": "中文字幕"
      },
      {
        "id": "33",
        "text": "日韩精品"
      },
      {
        "id": "34",
        "text": "欧美精品"
      },
      {
        "id": "35",
        "text": "动漫精品"
      },
      {
        "id": "36",
        "text": "三级伦理"
      },
    ]
  }
  async getHome() {
    const cate = env.get("category")
    const page = env.get("page")
    const url = `${env.baseUrl}/cn/home/web/index.php/vod/type/id/${cate}/page/${page}.html`
    const $ = kitty.load(await req(url))
    return $("ul.videos li").toArray().map<IMovie>(item=> {
      const a = $(item).find("a")
      const title = a.attr("title") ?? ""
      const id = a.attr("href") ?? ""
      const cover = a.find("img").attr("src") ?? ""
      const remark = a.find(".badge").text().trim()
      return <IMovie>{ id, title, cover, remark }
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
    return $("ul.videos li").toArray().map<IMovie>(item=> {
      const a = $(item).find("a")
      const title = a.attr("title") ?? ""
      const id = a.attr("href") ?? ""
      const cover = a.find("img").attr("src") ?? ""
      const remark = a.find(".badge").text().trim()
      return <IMovie>{ id, title, cover, remark }
    })
  }
}

// TEST
// const env = createTestEnv("https://www.gdd5.quest")
// const call = new GDD();
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