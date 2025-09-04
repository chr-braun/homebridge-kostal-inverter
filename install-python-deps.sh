#!/bin/bash
# Python Dependencies Installation Script for Homebridge Kostal Inverter Plugin

echo "🐍 Installing Python dependencies for Kostal Data Bridge..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Try different installation methods
echo "📦 Attempting to install Python dependencies..."

# Method 1: Try with --break-system-packages (for newer Python versions)
if python3 -m pip install -r requirements.txt --quiet --break-system-packages 2>/dev/null; then
    echo "✅ Python dependencies installed successfully!"
    exit 0
fi

# Method 2: Try with --user flag
if python3 -m pip install -r requirements.txt --quiet --user 2>/dev/null; then
    echo "✅ Python dependencies installed successfully (user mode)!"
    exit 0
fi

# Method 3: Try with virtual environment
if python3 -m venv venv 2>/dev/null; then
    source venv/bin/activate
    if pip install -r requirements.txt --quiet; then
        echo "✅ Python dependencies installed in virtual environment!"
        echo "💡 To use the Kostal bridge, activate the virtual environment first:"
        echo "   source venv/bin/activate"
        echo "   python3 kostal_data_bridge.py"
        exit 0
    fi
fi

# If all methods fail
echo "❌ Failed to install Python dependencies automatically."
echo "🔧 Please install manually:"
echo "   pip3 install -r requirements.txt"
echo "   or"
echo "   pip3 install paho-mqtt pykoplenti"
echo ""
echo "📖 For more help, see: https://github.com/chr-braun/homebridge-kostal-inverter"
exit 1
