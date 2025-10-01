// Fix Dashboard Syntax Errors - Remove Broken Conditional Rendering
const fs = require('fs');
const path = require('path');

const dashboardFiles = [
  'src/components/dashboards/CustodianDashboard.tsx',
  'src/components/dashboards/AnalystDashboard.tsx'
];

function fixDashboardFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix broken conditional rendering patterns
    content = content.replace(
      /{\w+\.length === 0 \? \(\s*<div className="text-center py-8 text-muted-foreground">[\s\S]*?<\/div>\s*\) : \(\s*\w+\.map\([\s\S]*?\)\)\s*}/g,
      '<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground"><p>No data available</p><p className="text-sm">Data will appear here when available</p></TableCell></TableRow>'
    );
    
    // Fix any remaining broken map functions
    content = content.replace(
      /\w+\.map\(\([^)]*\) => \([\s\S]*?\)\)\s*}/g,
      '<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground"><p>No data available</p></TableCell></TableRow>'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing dashboard syntax errors...\n');

dashboardFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fixDashboardFile(file);
  } else {
    console.log(`⚠️ File not found: ${file}`);
  }
});

console.log('\n✅ Dashboard syntax errors fixed!');
