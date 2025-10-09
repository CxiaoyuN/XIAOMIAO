export default class LiuYue implements Handle {
  getConfig() {
    return {
      id: '5weiting',
      name: '六月听书网',
      api: 'http://www.5weiting.com',
      type: 1,
      nsfw: false
    };
  }

  async getCategory() {
    return [
      { text: '修真武侠', id: 't2' },
      { text: '都市言情', id: 't28' },
      { text: '玄幻奇幻', id: 't1' }
    ];
  }

  async getHome() {
    return [];
  }

  async getSearch(keyword: string) {
    const res = await fetch(`http://www.5weiting.com/search?key=${encodeURIComponent(keyword)}`);
    const html = await res.text();
    const dom = new DOMParser().parseFromString(html, 'text/html');
    const items = [...dom.querySelectorAll('.bookbox')];
    return items.map(el => {
      const a = el.querySelector('a');
      const img = el.querySelector('img');
      const title = a?.getAttribute('title') || '';
      const id = a?.getAttribute('href')?.split('/').pop() || '';
      return {
        id,
        title,
        cover: img?.getAttribute('src') || '',
        remark: el.querySelector('.book_des')?.textContent?.trim() || ''
      };
    });
  }

  async getDetail(id: string) {
    const res = await fetch(`http://www.5weiting.com/list/${id}`);
    const html = await res.text();
    const dom = new DOMParser().parseFromString(html, 'text/html');
    const title = dom.querySelector('.book_title')?.textContent?.trim() || '';
    const cover = dom.querySelector('.bookimg img')?.getAttribute('src') || '';
    const desc = dom.querySelector('.book_des')?.textContent?.trim() || '';
    const remark = dom.querySelector('.book_update')?.textContent?.trim() || '';
    const playlist = [{
      name: '播放列表',
      videos: [...dom.querySelectorAll('.playlist li')].map(li => {
        const a = li.querySelector('a');
        return {
          name: a?.textContent?.trim() || '',
          url: a?.getAttribute('href') || ''
        };
      })
    }];
    return { id, title, cover, desc, remark, playlist };
  }

  async parseIframe(url: string) {
    return url;
  }
}
