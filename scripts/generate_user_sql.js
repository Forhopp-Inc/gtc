const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync("Tahir1980", salt);
console.log(`INSERT INTO users (name, username, password_hash) VALUES ('Tahir Mahmood', 'tahirmahmood83', '${hash}');`);
