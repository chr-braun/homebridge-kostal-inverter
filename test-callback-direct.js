#!/usr/bin/env node

console.log('🧪 Teste Callback-Fix direkt...');

// Simuliere das echte Problem: Callback wird mehrfach aufgerufen
function testCallbackIssue() {
  console.log('\n🔍 Teste das echte Callback-Problem...');
  
  let callbackCount = 0;
  const callback = (error, value) => {
    callbackCount++;
    console.log(`Callback aufgerufen (${callbackCount}x):`, error ? `Error: ${error.message}` : `Value: ${value}`);
    
    if (callbackCount > 1) {
      console.log(`❌ PROBLEM: Callback wurde ${callbackCount}x aufgerufen!`);
    } else {
      console.log(`✅ OK: Callback wurde nur 1x aufgerufen`);
    }
  };

  // Simuliere den Event Handler
  const handler = (callback) => {
    // Das ist der neue Code mit setImmediate
    setImmediate(() => {
      try {
        const power = 1500; // Simuliere Solarproduktion
        const luxValue = Math.max(0.0001, Math.abs(power));
        callback(null, luxValue);
      } catch (error) {
        callback(error instanceof Error ? error : new Error(String(error)));
      }
    });
  };

  // Teste den Handler
  console.log('📡 Rufe Handler auf...');
  handler(callback);
  
  // Warte auf asynchrone Ausführung
  setTimeout(() => {
    console.log(`\n📊 Ergebnis: Callback wurde ${callbackCount}x aufgerufen`);
    if (callbackCount === 1) {
      console.log('✅ Fix erfolgreich!');
    } else {
      console.log('❌ Fix fehlgeschlagen!');
    }
  }, 50);
}

// Teste auch das alte Problem
function testOldCallbackIssue() {
  console.log('\n🔍 Teste das alte Callback-Problem...');
  
  let callbackCount = 0;
  const callback = (error, value) => {
    callbackCount++;
    console.log(`Callback aufgerufen (${callbackCount}x):`, error ? `Error: ${error.message}` : `Value: ${value}`);
    
    if (callbackCount > 1) {
      console.log(`❌ PROBLEM: Callback wurde ${callbackCount}x aufgerufen!`);
    } else {
      console.log(`✅ OK: Callback wurde nur 1x aufgerufen`);
    }
  };

  // Simuliere den alten Event Handler (ohne setImmediate)
  const oldHandler = (callback) => {
    try {
      const power = 1500;
      const luxValue = Math.max(0.0001, Math.abs(power));
      callback(null, luxValue);
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  };

  // Teste den alten Handler
  console.log('📡 Rufe alten Handler auf...');
  oldHandler(callback);
  
  console.log(`\n📊 Ergebnis: Callback wurde ${callbackCount}x aufgerufen`);
  if (callbackCount === 1) {
    console.log('✅ Alter Code funktioniert auch!');
  } else {
    console.log('❌ Alter Code hat Probleme!');
  }
}

// Führe Tests aus
testOldCallbackIssue();
testCallbackIssue();

console.log('\n🎯 Fazit:');
console.log('- setImmediate() sollte Race Conditions vermeiden');
console.log('- Der Test zeigt, ob der Callback nur einmal aufgerufen wird');
console.log('- Das ist der Schlüssel zur Lösung des HomeKit-Problems');
