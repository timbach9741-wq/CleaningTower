import fs from 'fs';

let html = fs.readFileSync('stitch_home.html', 'utf8');

// Extract body inner content
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (!bodyMatch) {
  console.error("Could not find <body> tag");
  process.exit(1);
}

let content = bodyMatch[1];

// Convert to JSX
content = content.replace(/class=/g, 'className=');
content = content.replace(/for=/g, 'htmlFor=');
content = content.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

// Self close input and img tags
content = content.replace(/<img([^>]*?)(?<!\/)>/g, '<img$1 />');
content = content.replace(/<input([^>]*?)(?<!\/)>/g, '<input$1 />');
content = content.replace(/<hr([^>]*?)(?<!\/)>/g, '<hr$1 />');
content = content.replace(/<br([^>]*?)(?<!\/)>/g, '<br$1 />');

// Style attributes
// style="font-variation-settings: 'FILL' 1;"
content = content.replace(/style="font-variation-settings:\s*'FILL'\s*1;"/g, "style={{ fontVariationSettings: \"'FILL' 1\" }}");

const jsxFile = `import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function CleaningHome() {
  const [houseType, setHouseType] = useState('아파트');
  const [size, setSize] = useState(24);
  const [addons, setAddons] = useState({
    syndrome: false,
    acWash: false,
    regular: false
  });

  const getEstimatedPrice = () => {
    const basePrice = houseType === '아파트' ? 12000 : 14000;
    let total = size * basePrice;
    if (addons.syndrome) total += 150000;
    if (addons.acWash) total += 120000;
    if (addons.regular) total += 200000;
    return total;
  };

  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden">
${content}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/CleaningHome.jsx', jsxFile, 'utf8');
console.log('Successfully converted and written to src/pages/CleaningHome.jsx');
