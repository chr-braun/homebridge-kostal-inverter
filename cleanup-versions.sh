#!/bin/bash

# Alle Versionen höher als 1.1.0 löschen
versions=(
  "2.0.1-dev.8"
  "2.0.1-dev.7" 
  "2.0.1-dev.6"
  "2.0.1-dev.5"
  "2.0.1-dev.4"
  "2.0.1-dev.3"
  "2.0.1-dev.2"
  "2.0.0"
  "2.0.0-beta.6"
  "2.0.0-beta.5"
  "2.0.0-beta.4"
  "2.0.0-beta.3"
  "2.0.0-beta.2"
  "2.0.0-beta.1"
  "1.3.0-dev.2"
  "1.3.0-dev.1"
  "1.3.0-beta.1"
  "1.2.2"
  "1.2.1"
  "1.2.0"
)

for version in "${versions[@]}"; do
  echo "Lösche Version $version..."
  npm unpublish homebridge-kostal-inverter@$version --force
  sleep 2
done

echo "Alle Versionen höher als 1.1.0 gelöscht!"
