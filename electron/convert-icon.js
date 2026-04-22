const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

const input = path.join(__dirname, 'assets/icons/icon.png');
const output = path.join(__dirname, 'assets/icons/icon.ico');

console.log(`Converting ${input} to ${output}...`);

pngToIco(input)
  .then(buf => {
    fs.writeFileSync(output, buf);
    console.log('Conversion successful!');
  })
  .catch(err => {
    console.error('Conversion failed:', err);
    process.exit(1);
  });
