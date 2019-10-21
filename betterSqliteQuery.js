const Database = require('better-sqlite3');
const db = new Database('db.sqlite', { verbose: console.log });
const { performance } = require("perf_hooks");

const start = performance.now()

const data = db.prepare(`
SELECT DISTINCT bars_normalized.id, bars_normalized.name FROM bars_normalized
LEFT OUTER JOIN bars_wines
    ON bars_normalized.id = bars_wines.bar_id
LEFT OUTER JOIN wines
    ON wines.id = bars_wines.wine_id
WHERE year > 2010
`).all()

console.log(data.length)

console.log(performance.now() - start)