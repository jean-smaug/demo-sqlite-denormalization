const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("db.sqlite");
const { performance } = require('perf_hooks');

let start = performance.now()

// SELECT DISTINCT wines.id, wines.name
// FROM wines
// WHERE id IN (
//     SELECT DISTINCT wines_ids
//     FROM bars_denormalized
//     WHERE country
// );


db.all(`
    SELECT DISTINCT wines.id, wines.name
    FROM wines
    WHERE id IN (
        SELECT DISTINCT json_each.value AS id
        FROM bars_denormalized, json_each(bars_denormalized.wines_ids)
        WHERE bars_denormalized.country = 'Spain'
    ) AND country = 'France';
    `,
    (err, bars) => {
        if(err) console.error(err)

        console.log(bars)

        let end = performance.now()
        console.log(end - start)
    }
)
