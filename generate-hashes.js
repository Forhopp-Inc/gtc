const bcrypt = require('bcryptjs');

const users = [
  { name: 'xx', username: 'xx', password: 'xx' }
];

console.log('-- SQL INSERT statements for new users\n');

users.forEach(user => {
  const hash = bcrypt.hashSync(user.password, 10);
  console.log(`INSERT INTO users (name, username, password_hash)`);
  console.log(`VALUES ('${user.name}', '${user.username}', '${hash}');\n`);
});
