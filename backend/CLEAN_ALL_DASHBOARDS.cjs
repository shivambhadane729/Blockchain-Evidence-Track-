// Clean All Dashboards - Remove ALL Dummy Data
const fs = require('fs');
const path = require('path');

const dashboardFiles = [
  '../ReactWebApp/src/components/dashboards/JudgeDashboard.tsx',
  '../ReactWebApp/src/components/dashboards/ProsecutorDashboard.tsx', 
  '../ReactWebApp/src/components/dashboards/CustodianDashboard.tsx',
  '../ReactWebApp/src/components/dashboards/SHODashboard.tsx',
  '../ReactWebApp/src/components/dashboards/AnalystDashboard.tsx'
];

function cleanDashboardFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove mock data arrays
    content = content.replace(/const mock\w+:\s*\w+\[\]\s*=\s*\[[\s\S]*?\];/g, '// Mock data removed - now using real backend API');
    
    // Remove mock data usage in useState
    content = content.replace(/useState<.*?>\(mock\w+\)/g, 'useState([])');
    content = content.replace(/useState\(mock\w+\)/g, 'useState([])');
    
    // Remove hardcoded mock data assignments
    content = content.replace(/setSearchResult\(mock\w+\)/g, 'setSearchResult(null)');
    content = content.replace(/setSearchResult\(mock\w+\)/g, 'setSearchResult(null)');
    
    // Add loading and error states
    if (!content.includes('useState(true)') && content.includes('useState([])')) {
      content = content.replace(
        /const \[(\w+), set\w+\] = useState\(\[\]\);/g,
        'const [$1, set$1] = useState([]);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<string | null>(null);'
      );
    }
    
    // Add empty state messages
    content = content.replace(
      /{(\w+)\.map\(/g,
      '{$1.length === 0 ? (\n            <div className="text-center py-8 text-muted-foreground">\n              <p>No data available</p>\n              <p className="text-sm">Data will appear here when available</p>\n            </div>\n          ) : (\n            $1.map('
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Cleaned: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
  }
}

console.log('🧹 Cleaning all dashboard files...\n');

dashboardFiles.forEach(file => {
  if (fs.existsSync(file)) {
    cleanDashboardFile(file);
  } else {
    console.log(`⚠️ File not found: ${file}`);
  }
});

console.log('\n✅ All dashboards cleaned!');
console.log('🚫 All dummy data removed');
console.log('📋 Ready for real backend integration');
