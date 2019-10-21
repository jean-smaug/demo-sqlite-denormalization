const Sqlite = require("better-sqlite3");
const db = new Sqlite("db.sqlite");
const faker = require("faker");

const NUMBER_OF_BARS = 1000;
const NUMBER_OF_WINES = 1000;

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

const shouldDrop = process.env.DROP === "true";

if (shouldDrop) db.prepare("DROP TABLE IF EXISTS wines").run();
db.prepare(`
      CREATE TABLE IF NOT EXISTS wines (
          id TEXT PRIMARY KEY,
          name TEXT,
          country TEXT,
          year NUMBER
      );
  `).run();

Array(NUMBER_OF_WINES)
  .fill()
  .forEach(() => {
    db.prepare(
      `
          INSERT INTO wines (id, name, country, year) 
          VALUES ($id, $name, $country, $year)
      `,
    ).run({
      id: faker.random.uuid(),
      name: faker.lorem.words(),
      country: faker.address.country(),
      year: faker.date.past(50).getFullYear()
    });
  });

if (shouldDrop) db.run("DROP TABLE IF EXISTS bars_denormalized");
db.prepare(`
      CREATE TABLE IF NOT EXISTS bars_denormalized (
          id TEXT PRIMARY KEY,
          name TEXT,
          country TEXT,
          wines_ids JSON
      );
  `).run();

if (shouldDrop) db.prepare("DROP TABLE IF EXISTS bars_normalized").run();
db.prepare(`
      CREATE TABLE IF NOT EXISTS bars_normalized (
          id TEXT PRIMARY KEY,
          name TEXT,
          country TEXT
      );
  `).run();

if (shouldDrop) db.prepare("DROP TABLE IF EXISTS bars_wines").run();
db.prepare(`
      CREATE TABLE IF NOT EXISTS bars_wines (
          bar_id TEXT,
          wine_id TEXT
      );
  `).run();

const rows = db.prepare("SELECT DISTINCT id FROM wines").all()
const ids = rows.map(item => item.id);
Array(NUMBER_OF_BARS)
  .fill()
  .forEach(wine => {
    const bar = {
      id: faker.random.uuid(),
      name: faker.lorem.words(),
      country: faker.address.country()
    };

    const winesIds = getRandom(
      ids,
      20
    );

    db.prepare(
      `
            INSERT INTO bars_denormalized (id, name, country, wines_ids) 
            VALUES ($id, $name, $country, json($winesIds))
        `
    ).run({
      ...bar,
      winesIds: JSON.stringify(winesIds)
    });

    db.prepare(
      `
            INSERT INTO bars_normalized (id, name, country) 
            VALUES ($id, $name, $country)
        `,
      {
        ...bar
      }
    );

    winesIds.forEach(wineId => {
      db.prepare(
        `
                INSERT INTO bars_wines (bar_id, wine_id) 
                VALUES ($barId, $wineId)
            `,
        {
          barId: bar.$id,
          wineId: wineId
        }
      );
    });
  });
