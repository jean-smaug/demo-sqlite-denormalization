const Sqlite = require("better-sqlite3");
const db = new Sqlite("db.sqlite");
const faker = require("faker");

const NUMBER_OF_BARS = 10000;
const NUMBER_OF_WINES = 50000;
const NUMBER_OF_WINES_PER_BARS = 1000;

const shouldDrop = process.env.DROP === "true";

if(shouldDrop) {
  console.log('==> TABLES DROP')
  db.prepare("DROP TABLE IF EXISTS wines").run();
  db.prepare("DROP TABLE IF EXISTS bars_denormalized").run();
  db.prepare("DROP TABLE IF EXISTS bars_normalized").run();
  db.prepare("DROP TABLE IF EXISTS bars_wines").run();
}

console.log('==> TABLES CREATION')
db.prepare(`
  CREATE TABLE IF NOT EXISTS wines (
    id TEXT PRIMARY KEY,
    name TEXT,
    country TEXT,
    year NUMBER
  );
`).run();
  
db.prepare(`
  CREATE TABLE IF NOT EXISTS bars_denormalized (
    id TEXT PRIMARY KEY,
    name TEXT,
    country TEXT,
    wines_ids JSON
  );`
).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS bars_normalized (
    id TEXT PRIMARY KEY,
    name TEXT,
    country TEXT
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS bars_wines (
    bar_id TEXT,
    wine_id TEXT
  );
`).run();

const winesStatement = db.prepare(`
  INSERT INTO wines (id, name, country, year) 
  VALUES ($id, $name, $country, $year)
`)

const barDenormalizedStatement = db.prepare(`
  INSERT INTO bars_denormalized (id, name, country, wines_ids) 
  VALUES ($id, $name, $country, json($winesIds))
`)

const barNormalizedStatement = db.prepare(`
  INSERT INTO bars_normalized (id, name, country) 
  VALUES ($id, $name, $country)
`)

const barsWinesStatement = db.prepare(`
  INSERT INTO bars_wines (bar_id, wine_id) 
  VALUES ($barId, $wineId)
`)


const insertMany = (statement) => db.transaction((rows) => {
  console.log(`${rows.length} elements`)
  for (const row of rows) {
    statement.run(row)
  };
});

const wines = Array(NUMBER_OF_WINES)
  .fill()
  .map(() => ({
      id: faker.random.uuid(),
      name: faker.lorem.words(),
      country: faker.address.country(),
      year: faker.date.past(50).getFullYear()
    })
  )

console.log('==> WINES INSERTION')
insertMany(winesStatement)(wines)

const bars = Array(NUMBER_OF_BARS)
  .fill()
  .map(() => ({
    id: faker.random.uuid(),
    name: faker.lorem.words(),
    country: faker.address.country(),
    winesIds: db.prepare(`
      SELECT id FROM wines WHERE id IN (SELECT id FROM wines ORDER BY RANDOM() LIMIT ${NUMBER_OF_WINES_PER_BARS})
    `).all().map(wine => wine.id)
  }))

console.log('==> BAR DENORMALIZED INSERTION')
insertMany(barDenormalizedStatement)(bars.map(bar => ({...bar, winesIds: JSON.stringify(bar.winesIds)})))

console.log('==> BAR NORMALIZED INSERTION')
insertMany(barNormalizedStatement)(bars.map(bar => {
  const barCopy = { ...bar };
  delete barCopy.winesIds
  return barCopy
}));

console.log('==> WINES BARS INSERTION')
const winesBars = bars.reduce((acc, bar) => {
  return [...acc, ...bar.winesIds.map((wineId) => ({ wineId, barId: bar.id }))]
}, [])

insertMany(barsWinesStatement)(winesBars);
