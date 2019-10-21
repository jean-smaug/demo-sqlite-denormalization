const Sqlite = require("better-sqlite3");
const db = new Sqlite("db.sqlite");
const faker = require("faker");

const NUMBER_OF_BARS = 5000;
const NUMBER_OF_WINES = 50000;
const NUMBER_OF_WINES_PER_BARS = 1000;

const shouldDrop = process.env.DROP === "true";

console.log('start wines')
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
  .forEach((_, index) => {
    if(index % 1000 === 0) console.log(`Wines --> ${index}`)
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

if (shouldDrop) db.prepare("DROP TABLE IF EXISTS bars_denormalized").run();
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

console.log('bars')
Array(NUMBER_OF_BARS)
  .fill()
  .forEach((_, index) => {
    if(index % 1000 === 0) console.log(`Bars --> ${index}`)

    const bar = {
      id: faker.random.uuid(),
      name: faker.lorem.words(),
      country: faker.address.country()
    };

    const winesIds = db.prepare(`
    SELECT id FROM wines WHERE id IN (SELECT id FROM wines ORDER BY RANDOM() LIMIT ${NUMBER_OF_WINES_PER_BARS})
    `).all().map(wine => wine.id)

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
        `
    ).run({
      ...bar
    });

    winesIds.forEach(wineId => {
      db.prepare(
        `
                INSERT INTO bars_wines (bar_id, wine_id) 
                VALUES ($barId, $wineId)
            `
      ).run({
        barId: bar.id,
        wineId: wineId
      });
    });
  });
