async function fetchWikiInfoboxImage(title) {
  try {
    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    const html = await res.text();
    const imgMatch = html.match(/<table class="infobox[^>]*>[\s\S]*?<img[^>]*src="\/\/upload\.wikimedia\.org\/wikipedia\/en\/thumb\/([^"]+)"/);
    if (imgMatch && !imgMatch[1].includes('OOjs')) {
      return `https://upload.wikimedia.org/wikipedia/en/${imgMatch[1].split('/').slice(0, -1).join('/')}`;
    }
    const imgMatch2 = html.match(/<table class="infobox[^>]*>[\s\S]*?<img[^>]*src="\/\/upload\.wikimedia\.org\/wikipedia\/en\/([^"]+)"/);
    if (imgMatch2 && !imgMatch2[1].includes('OOjs')) {
      return `https://upload.wikimedia.org/wikipedia/en/${imgMatch2[1]}`;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function run() {
  const titles = [
    'The Wedding Party (2016 film)',
    'The Wedding Party (film)',
    'Lionheart (2018 film)',
    'Lionheart (Nigerian film)'
  ];
  
  for (const title of titles) {
    const img = await fetchWikiInfoboxImage(title);
    console.log(`${title}: ${img}`);
  }
}

run();
