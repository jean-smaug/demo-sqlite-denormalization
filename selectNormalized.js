const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("db.sqlite");
const { performance } = require('perf_hooks');

let start = performance.now()

db.all(`
    SELECT DISTINCT bars_normalized.id, bars_normalized.name FROM bars_normalized
    LEFT OUTER JOIN bars_wines
        ON bars_normalized.id = bars_wines.bar_id
    LEFT OUTER JOIN wines
        ON wines.id = bars_wines.wine_id
    WHERE year > 2010
    `,
    (err, bars) => {
        if(err) console.error(err)

        console.log(bars)

        let end = performance.now()
        console.log(end - start)
    }
)
