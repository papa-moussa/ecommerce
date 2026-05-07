const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../prisma/seed.ts');
let content = fs.readFileSync(seedPath, 'utf8');

// Update categories and add perfume fields
content = content.replace(
  /categorySlug: 'femme'/g,
  "categorySlug: 'best', concentration: 'EAU_DE_PARFUM', family: 'FLORAL', sizeMl: 100",
);
content = content.replace(
  /categorySlug: 'homme'/g,
  "categorySlug: 'news', concentration: 'EAU_DE_TOILETTE', family: 'BOISE', sizeMl: 100",
);
content = content.replace(
  /categorySlug: 'unisexe'/g,
  "categorySlug: 'niche', concentration: 'PARFUM', family: 'ORIENTAL', sizeMl: 50",
);

// Also remove imageSeeds since I removed it from the interface to simplify
content = content.replace(/imageSeeds: \[.*?\],/g, '');

fs.writeFileSync(seedPath, content);
console.log('seed.ts patched successfully.');
