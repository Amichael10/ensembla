import fs from 'fs';

function checkTagBalance(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let stack = [];
  const tagRegex = /<(\/?[a-zA-Z0-9]+)([^>]*)>/g;
  let match;
  let lines = content.split('\n');
  
  // This is a very crude check and might have false positives with nested strings/comments
  // but it's better than nothing for finding major unclosed tags.
  
  while ((match = tagRegex.exec(content)) !== null) {
    const tagName = match[1];
    const isClosing = tagName.startsWith('/');
    const name = isClosing ? tagName.substring(1) : tagName;
    
    // Ignore self-closing or single tags
    if (match[0].endsWith('/>') || ['img', 'br', 'input', 'hr', 'link', 'meta'].includes(name.toLowerCase())) {
      continue;
    }

    if (isClosing) {
      if (stack.length === 0) {
        console.log(`Extra closing tag </${name}> at index ${match.index}`);
      } else {
        const top = stack.pop();
        if (top.name !== name) {
          console.log(`Mismatched closing tag </${name}>, expected </${top.name}> (opened at index ${top.index})`);
        }
      }
    } else {
      stack.push({ name, index: match.index });
    }
  }
  
  stack.forEach(tag => {
    console.log(`Unclosed tag <${tag.name}> opened at index ${tag.index}`);
  });
  
  if (stack.length === 0) console.log(`${filePath}: Tags balanced (crude check)`);
}

checkTagBalance('src/pages/admin/AdminYouTubeVideos.jsx');
checkTagBalance('src/pages/admin/AdminCinemaFilms.jsx');
checkTagBalance('src/pages/admin/AdminCinemaScraping.jsx');
