const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("db.sqlite");
const { performance, PerformanceObserver } = require('perf_hooks');


let start = performance.now()
db.all('SELECT id FROM wines WHERE year > 2010;', (err, rows) => {
    const winesIds = rows.map(row => row.id).join("','")

    db.all(`
    SELECT bars.id, name FROM bars, json_each(bars.wines_ids)
    WHERE json_each.value IN ('${winesIds}')`,
    (err, bars) => {
        if(err) console.error(err)
        console.log(bars)
            
            let end = performance.now()
            console.log(end - start)
    })
})