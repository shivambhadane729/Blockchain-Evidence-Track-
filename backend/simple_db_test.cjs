const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'ndep.db');

console.log('🔍 Testing direct database connection...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Test query
db.all('SELECT email, name, role FROM users', (err, rows) => {
  if (err) {
    console.error('❌ Query failed:', err.message);
    return;
  }
  
  console.log('\n📋 All users in database:');
  if (rows.length === 0) {
    console.log('   No users found');
  } else {
    rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.name} (${row.email}) - Role: "${row.role}"`);
    });
  }
  
  // Test specific user lookup
  console.log('\n🔍 Testing specific user lookup...');
  db.get('SELECT * FROM users WHERE email = ?', ['officer.rajesh@police.gov.in'], (err, row) => {
    if (err) {
      console.error('❌ Specific query failed:', err.message);
      return;
    }
    
    if (!row) {
      console.log('   ❌ User not found');
    } else {
      console.log('   ✅ User found:');
      console.log('   ID:', row.id);
      console.log('   Email:', row.email);
      console.log('   Name:', row.name);
      console.log('   Role:', row.role);
      console.log('   Department:', row.department);
    }
    
    db.close();
  });
});
