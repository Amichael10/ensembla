const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/admin/AdminUsers.jsx',
  'src/pages/admin/AdminCompanies.jsx',
  'src/pages/admin/AdminClaims.jsx'
];

const replacements = {
  'bg-[#13192B]': 'bg-surface',
  'bg-[#0A0F1E]': 'bg-surface-2',
  'border-[#252D45]': 'border-border',
  'text-[#F5F0E8]': 'text-text-primary',
  'text-[#7A8099]': 'text-text-muted',
  'bg-[#1C2440]': 'bg-surface-2',
  'bg-[#0A0F1E]/20': 'bg-surface-2/20',
  'border-[#252D45]/30': 'border-border/30',
  'border-[#252D45]/50': 'border-border/50'
};

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const [key, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'g'), value);
    }
    
    // Additional fix for Claims toast
    if (file.includes('AdminClaims.jsx')) {
      content = content.replace("toast.error('Failed to load claims');", "// toast.error('Failed to load claims');");
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${file}`);
    } else {
      console.log(`No changes for ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});
