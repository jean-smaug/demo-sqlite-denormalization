const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("db.sqlite");
const { performance } = require('perf_hooks');

let start = performance.now()

db.all(`
    SELECT DISTINCT bars_denormalized.id, name FROM bars_denormalized, json_each(bars_denormalized.wines_ids)
    WHERE json_each.value IN (SELECT DISTINCT id FROM wines WHERE year > 2010);`,
    (err, bars) => {
        if(err) console.error(err)

        console.log(bars)

        let end = performance.now()
        console.log(end - start)
    }
)
