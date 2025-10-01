const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database', 'ndep.db'));

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Tables in database:');
        rows.forEach(row => console.log('- ' + row.name));
    }
    db.close();
});
