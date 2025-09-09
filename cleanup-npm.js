#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧹 Lösche alle dev- und beta-Versionen von npm...');

// Versionen die behalten werden sollen
const keepVersions = ['1.1.0', '1.2.0', '1.2.1', '1.2.2', '2.0.0', '2.1.0', '2.1.1'];

// Alle Versionen abrufen
const versionsOutput = execSync('npm view homebridge-kostal-inverter versions --json', { encoding: 'utf8' });
const allVersions = JSON.parse(versionsOutput);

console.log(`📊 Gefunden: ${allVersions.length} Versionen`);

// Versionen zum Löschen identifizieren
const versionsToDelete = allVersions.filter(version => !keepVersions.includes(version));

console.log(`🗑️  Zu löschende Versionen: ${versionsToDelete.length}`);
console.log(`✅ Behaltene Versionen: ${keepVersions.length}`);

// Versionen löschen
let deletedCount = 0;
let errorCount = 0;

for (const version of versionsToDelete) {
  try {
    console.log(`🗑️  Lösche Version ${version}...`);
    execSync(`npm unpublish homebridge-kostal-inverter@${version}`, { stdio: 'pipe' });
    deletedCount++;
    console.log(`✅ Version ${version} gelöscht`);
  } catch (error) {
    errorCount++;
    console.log(`❌ Fehler beim Löschen von ${version}: ${error.message}`);
  }
}

console.log('\n📊 Zusammenfassung:');
console.log(`✅ Erfolgreich gelöscht: ${deletedCount}`);
console.log(`❌ Fehler: ${errorCount}`);
console.log(`📦 Verbleibende Versionen: ${keepVersions.join(', ')}`);

if (errorCount > 0) {
  console.log('\n⚠️  Einige Versionen konnten nicht gelöscht werden. Mögliche Gründe:');
  console.log('   - Version ist zu alt (npm erlaubt nur Löschung von Versionen < 72h)');
  console.log('   - Berechtigungsprobleme');
  console.log('   - Version existiert nicht mehr');
}
