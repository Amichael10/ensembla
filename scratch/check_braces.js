import fs from 'fs';

const files = [
  'src/pages/admin/AdminChannels.jsx',
  'src/pages/admin/AdminChannelDetail.jsx',
  'src/pages/admin/AdminCinemaFilms.jsx',
  'src/pages/admin/AdminCinemaScraping.jsx',
  'src/App.tsx',
  'src/pages/admin/AdminLayout.jsx'
];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    let open = 0;
    for (let char of content) {
      if (char === '{') open++;
      if (char === '}') open--;
    }
    console.log(`${file}: ${open === 0 ? 'Balanced' : 'UNBALANCED (' + open + ')'}`);
  } catch (e) {
    console.log(`${file}: NOT FOUND`);
  }
});
