const os = require("os");
const path = require("path");

console.log(os.type());
console.log(os.version());
console.log(os.homedir());

console.log(__dirname);
console.log(__filename);

console.log(path.dirname(__filename)); // le répertoire
console.log(path.basename(__filename)); // le nom du fichier
console.log(path.extname(__filename)); // l'extension

console.log(path.parse(__filename)); // javascript object
