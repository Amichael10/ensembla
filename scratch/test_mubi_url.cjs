const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Try original URL
  let res1 = await context.request.get('https://api.mubi.com/v4/browse/films?historic_countries[]=NG&page=1&per_page=24', {
    headers: { 'client': 'web', 'Accept': 'application/json' }
  });
  let data1 = await res1.json();
  
  // Try new URL with sort and all_films
  let res2 = await context.request.get('https://api.mubi.com/v4/browse/films?historic_countries[]=NG&page=1&per_page=24&all_films=true&sort=popularity_quality_score', {
    headers: { 'client': 'web', 'Accept': 'application/json' }
  });
  let data2 = await res2.json();
  
  console.log('Original API total returned items in page 1:', data1.films ? data1.films.length : 0);
  console.log('New API total returned items in page 1:', data2.films ? data2.films.length : 0);
  
  await browser.close();
})();
