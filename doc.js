const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("db.sqlite");

db.serialize(() => {
    db.run('DROP TABLE IF EXISTS users')

    db.run(`
        CREATE TABLE IF NOT EXISTS users(name TEXT,phone JSON)
    `)

    db.run(`
        INSERT INTO users(name,phone) VALUES ('maxime', json('["832", "831"]'));
    `)

    db.run(`
        INSERT INTO users(name,phone) VALUES ('smaug', json('["832", "833"]'));
    `)

    db.all(`
        SELECT DISTINCT name, phone
        FROM users, json_each(users.phone)
        WHERE json_each.value IN ('831','830');
    `, (err, data) => {
        console.log('Err --> ', err)
        console.log(data)
    })
})