export default class libvio implements Handle {
  getConfig(): Iconfig {
    return {
      id: 'libvio',
      name: 'LIBVIO_WEB',
      api: 'https://www.libvio.cc',
      nsfw: false,
      type: 1,
    };
  }

  async getCategory(): Promise<ICategory[]> {
    return [
      { text: '电影', id: '1' },
      { text: '剧集', id: '2' },
      { text: '动漫', id: '4' },
      { text: '韩剧', id: '15' },
      { text: '美剧', id: '16' },
    ];
  }

  async getHome(): Promise<IMovie[]> {
    const cate = env.get('category');
    const page = env.get('page') || 1;
    const url = `${env.baseUrl}/type/${cate}.html?page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $('.stui-vodlist__box').toArray().map<IMovie>(item => {
      const a = $(item).find('a.stui-vodlist__thumb');
      const title = a.attr('title') ?? '';
      const remark = a.find('.pic-text.text-right').text().trim() ?? '';
      const quality = title.match(/(1080P|720P|蓝光|HD|清晰)/)?.[1] ?? '';
      return {
        id: a.attr('href') ?? '',
        title,
        cover: a.attr('data-original') ?? '',
        desc: '',
        remark: quality || remark,
        playlist: [],
      };
    });
  }

  async getDetail(): Promise<IMovie> {
    const id = env.get('movieId');
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const a = $('.stui-pannel-box .stui-vodlist__thumb.picture.v-thumb');
    const title = a.attr('title') ?? '';
    const cover = a.find('img').attr('data-original') ?? '';
    const desc = $('.detail.col-pd').text().trim() ?? '';

    const originalPageUrl = `${env.baseUrl}${id}`;
    const firstPlayPath = $('.stui-content__playlist a').first().attr('href') ?? '';

    const playlist: IPlaylist[] = [{
      title: '播放选项',
      videos: [
        {
          text: '🔗 原网页播放',
          url: originalPageUrl,
        },
        {
          text: '▶️ MP4直链播放',
          url: firstPlayPath,
        },
      ],
    }];

    return { id, title, cover, desc, remark: '', playlist };
  }

  async getSearch(): Promise<IMovie[]> {
    const page = env.get('page') || '1';
    const wd = env.get('keyword');
    const url = `${env.baseUrl}/vodsearch/${wd}----------${page}---.html`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $('.stui-vodlist__media li').toArray().map<IMovie>(item => {
      const a = $(item).find('.v-thumb.stui-vodlist__thumb');
      const title = a.attr('title') ?? '';
      const remark = $(item).find('.pic-text.text-right').text().trim() ?? '';
      const quality = title.match(/(1080P|720P|蓝光|HD|清晰)/)?.[1] ?? '';
      return {
        id: a.attr('href') ?? '',
        title,
        cover: a.attr('data-original') ?? '',
        desc: '',
        remark: quality || remark,
        playlist: [],
      };
    });
  }

  async parseIframe(): Promise<string | IPlaySource> {
    try {
      const result = await kitty.utils.getM3u8WithIframe(env);
      if (result && typeof result === 'object' && result.url) return result;
    } catch (e) {
      console.log('自动解析失败，尝试手动处理');
    }

    const iframe = env.get('iframe');
    const playUrl = `${env.baseUrl}${iframe}`;
    const html = await req(playUrl);
    const $ = kitty.load(html);

    const scriptText = $('script').toArray().map(s => $(s).text()).find(t => t.includes('player_aaaa'));
    if (!scriptText) {
      return {
        type: 'iframe',
        url: playUrl,
        headers: {
          Referer: env.baseUrl,
        },
      };
    }

    const match = scriptText.match(/player_aaaa\s*=\s*(\{[\s\S]*?\});/);
    if (!match) {
      return {
        type: 'iframe',
        url: playUrl,
        headers: {
          Referer: env.baseUrl,
        },
      };
    }

    let raw = match[1];
    raw = raw.replace(/([\w]+):/g, '"$1":');
    raw = raw.replace(/'/g, '"');
    const player = JSON.parse(raw);

    let url = player.url;
    if (player.encrypt === 1) {
      url = decodeURIComponent(url);
    } else if (player.encrypt === 2) {
      url = decodeURIComponent(base64decode(url));
    } else if (player.encrypt === 3) {
      url = decodeURIComponent(utf8to16(base64decode(url)));
    }

    if (url.endsWith('.mp4') || url.endsWith('.m3u8')) {
      return {
        url,
        headers: {
          Referer: 'https://www.libvio.cc/',
        },
      };
    }

    const vr2Url = `${env.baseUrl}/vid/plyr/vr2.php?url=${encodeURIComponent(url)}&next=${player.link_next}&id=${player.id}&nid=${player.nid}`;
    const vr2Html = await req(vr2Url);
    const videoMatch = vr2Html.match(/["'](https?:\/\/[^"']+\.(mp4|m3u8|flv|ts))["']/);
    if (videoMatch) {
      return {
        url: videoMatch[1],
        headers: {
          Referer: 'https://www.libvio.cc/',
        },
      };
    }

    return {
      type: 'iframe',
      url: playUrl,
      headers: {
        Referer: env.baseUrl,
      },
    };
  }
}

// 解码函数
function base64decode(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "", c1, c2, c3, c4, i = 0;
  str = str.replace(/[^A-Za-z0-9\+\/\=]/g, "");
  while (i < str.length) {
    c1 = chars.indexOf(str.charAt(i++));
    c2 = chars.indexOf(str.charAt(i++));
    c3 = chars.indexOf(str.charAt(i++));
    c4 = chars.indexOf(str.charAt(i++));
    out += String.fromCharCode((c1 << 2) | (c2 >> 4));
    if (c3 !== 64) out += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
    if (c4 !== 64) out += String.fromCharCode(((c3 & 3) << 6) | c4);
  }
  return out;
}

function utf8to16(str: string): string {
  let out = "", i = 0, len = str.length, c, char2, char3;
  while (i < len) {
    c = str.charCodeAt(i++);
    switch (c >> 4) {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        out += str.charAt(i - 1); break;
      case 12: case 13:
        char2 = str.charCodeAt(i++);
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F)); break;
      case 14:
        char2 = str.charCodeAt(i++);
        char3 = str.charCodeAt(i++);
        out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | (char3 & 0x3F)); break;
    }
  }
  return out;
}
