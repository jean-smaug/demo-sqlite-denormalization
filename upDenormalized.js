const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("db.sqlite");
const faker = require('faker');

const NUMBER_OF_BARS = 10
const NUMBER_OF_WINES = 100

// https://stackoverflow.com/questions/19269545/how-to-get-n-no-elements-randomly-from-an-array/38571132
function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

db.serialize(() => {
    db.run('DROP TABLE IF EXISTS wines')
    
    db.run(`
        CREATE TABLE IF NOT EXISTS wines (
            id NUMBER PRIMARY KEY,
            name STRING,
            country STRING,
            year NUMBER
        );
    `)
    
    Array(NUMBER_OF_WINES).fill().forEach(() => {
        db.run(`
            INSERT INTO wines (id, name, country, year) 
            VALUES ($id, $name, $country, $year)
        `, {
            $id: faker.random.uuid(),
            $name: faker.lorem.words(),
            $country: faker.address.country(),
            $year: faker.date.past(50).getFullYear()
        })
    })
    
    db.run('DROP TABLE IF EXISTS bars')

    db.run(`
        CREATE TABLE IF NOT EXISTS bars (
            id NUMBER PRIMARY KEY,
            name STRING,
            wines_ids JSON
        );
    `)

    db.all('SELECT id FROM wines', (err, rows) => {
        const ids = rows.map(item => item.id)
        Array(NUMBER_OF_BARS).fill().forEach(wine => {
            db.run(`
                INSERT INTO bars (id, name, wines_ids) 
                VALUES ($id, $name, json($winesIds))
            `, {
                $id: faker.random.uuid(),
                $name: faker.lorem.words(),
                $winesIds: JSON.stringify(getRandom(ids, Math.round(Math.random()*(NUMBER_OF_WINES/2))).map(i => i))
            })
        })
    })
})