var fs = require('fs');

const buff = fs.readFileSync('package.json');
fs.writeFileSync("build/package.json", buff);