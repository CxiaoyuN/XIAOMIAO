export default class LiuYue implements Handle {
  getConfig() {
    return {
      id: '6weiting',
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
    const categories = await this.getCategory();
    const result = [];

    for (const cat of categories) {
      const res = await fetch(`http://www.5weiting.com/ys/${cat.id}`);
      const html = await res.text();
      const dom = new DOMParser().parseFromString(html, 'text/html');
      const items = [...dom.querySelectorAll('.bookbox')].map(el => {
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

      result.push({ name: cat.text, items });
    }

    return result;
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
    const baseUrl = `http://www.5weiting.com/list/${id}`;
    const res = await fetch(baseUrl);
    const html = await res.text();
    const dom = new DOMParser().parseFromString(html, 'text/html');

    const title = dom.querySelector('.book_title')?.textContent?.trim() || '';
    const cover = dom.querySelector('.bookimg img')?.getAttribute('src') || '';
    const desc = dom.querySelector('.book_des')?.textContent?.trim() || '';
    const remark = dom.querySelector('.book_update')?.textContent?.trim() || '';

    const videos: { name: string; url: string }[] = [];

    // 获取总页数
    const pageLinks = [...dom.querySelectorAll('.pagination a')];
    const lastPage = pageLinks.length > 0
      ? parseInt(pageLinks[pageLinks.length - 2]?.textContent || '1')
      : 1;

    for (let i = 1; i <= lastPage; i++) {
      const pageRes = await fetch(`${baseUrl}/p${i}`);
      const pageHtml = await pageRes.text();
      const pageDom = new DOMParser().parseFromString(pageHtml, 'text/html');
      const pageVideos = [...pageDom.querySelectorAll('.play-list .list li')].map(li => {
        const a = li.querySelector('a');
        return {
          name: a?.textContent?.trim() || '',
          url: 'http://www.5weiting.com' + (a?.getAttribute('href') || '')
        };
      });
      videos.push(...pageVideos);
    }

    return {
      id,
      title,
      cover,
      desc,
      remark,
      playlist: [{ name: '播放列表', videos }]
    };
  }

  async parseIframe(url: string) {
    return url;
  }
}
