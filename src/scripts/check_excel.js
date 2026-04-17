import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../../src/data');

const files = ['africanmoviedb_only.xlsx', 'nollydata_only.xlsx'];

files.forEach(f => {
  const filePath = path.join(dataDir, f);
  const workbook = xlsx.readFile(filePath);
  console.log(`--- ${f} ---`);
  console.log('Sheets:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (data.length > 0) {
      console.log(`  [${sheetName}] Headers:`, data[0].slice(0, 10)); // first 10 columns
      console.log(`  [${sheetName}] Row Count:`, data.length - 1);
    }
  });
});
