const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {}
  });
  return filelist;
}

const files = walkSync('apps/web/src/app/admin').filter(f => f.endsWith('.tsx'));
let modifiedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace various input/select/textarea classes
  content = content.replace(/className="w-full border-brand-ink\/5 bg-brand-ivory\/20 rounded-xl px-4 py-3 text-sm focus:border-brand-gold focus:ring-4 focus:ring-brand-gold\/5 transition-all outline-none"/g, 'className="admin-input"');
  
  content = content.replace(/className="w-full border-brand-ink\/5 bg-brand-ivory\/20 rounded-xl px-4 py-3 text-sm focus:border-brand-gold focus:ring-4 focus:ring-brand-gold\/5 transition-all outline-none appearance-none"/g, 'className="admin-input appearance-none"');
  
  content = content.replace(/className="w-full border-brand-ink\/5 bg-brand-ivory\/20 rounded-xl px-4 py-3 text-sm focus:border-brand-gold transition-all outline-none resize-none"/g, 'className="admin-input resize-none"');
  
  content = content.replace(/className="w-full border-brand-ink\/5 bg-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-brand-gold\/10 transition-all outline-none"/g, 'className="admin-input text-xs"');
  
  content = content.replace(/className="w-full border-brand-ink\/5 bg-white rounded-xl px-3 py-2\.5 text-sm focus:border-brand-gold outline-none"/g, 'className="admin-input"');
  
  // Custom stock delta input
  content = content.replace(/className="w-full border-brand-ink\/5 bg-brand-ivory\/20 rounded-xl px-4 py-3 text-sm font-bold text-brand-ink focus:border-brand-gold outline-none text-center"/g, 'className="admin-input text-center font-medium"');
  
  content = content.replace(/className="w-full border-brand-ink\/5 bg-brand-ivory\/20 rounded-xl px-4 py-3 text-sm focus:border-brand-gold outline-none appearance-none"/g, 'className="admin-input appearance-none"');
  
  content = content.replace(/className="w-full border-brand-ink\/5 bg-brand-ivory\/20 rounded-xl px-4 py-3 text-sm focus:border-brand-gold outline-none"/g, 'className="admin-input"');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log('Updated', file);
  }
});

console.log('Total files modified:', modifiedFiles);
