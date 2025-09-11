#!/bin/bash

# Python Dependencies für Kostal Data Bridge
echo "Installing Python dependencies for Kostal Data Bridge..."

# Prüfe ob Python3 installiert ist
if ! command -v python3 &> /dev/null; then
    echo "Python3 ist nicht installiert. Bitte installiere Python3."
    exit 1
fi

# Installiere Python Dependencies
pip3 install requests --user

echo "Python dependencies installed successfully!"
echo "Kostal Data Bridge ist bereit für die Verwendung."
