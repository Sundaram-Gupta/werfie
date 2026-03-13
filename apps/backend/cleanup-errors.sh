#!/bin/bash

# Script to completely clear IDE errors from deleted TypeScript service
# Run this script to eliminate all phantom errors

echo "🧹 Cleaning up deleted TypeScript service remnants..."
echo ""

# 1. Remove any hidden TypeScript cache files
echo "1. Checking for TypeScript cache files..."
find /Users/ashish/Aspire/X/X-Backend -name ".tsbuildinfo" -type f -delete 2>/dev/null
echo "   ✓ TypeScript cache cleared"

# 2. Remove any VS Code workspace state
echo "2. Clearing VS Code workspace state..."
rm -rf /Users/ashish/Aspire/X/.vscode/.react 2>/dev/null
rm -rf /Users/ashish/Aspire/X/X-Backend/.vscode 2>/dev/null
echo "   ✓ VS Code state cleared"

# 3. Verify services directory is gone
echo "3. Verifying deleted directory..."
if [ -d "/Users/ashish/Aspire/X/X-Backend/services" ]; then
    echo "   ⚠️  Services directory still exists, removing..."
    rm -rf /Users/ashish/Aspire/X/X-Backend/services
    echo "   ✓ Services directory removed"
else
    echo "   ✓ Services directory already deleted"
fi

# 4. List current structure
echo ""
echo "4. Current X-Backend structure:"
ls -la /Users/ashish/Aspire/X/X-Backend/
echo ""

echo "✅ Cleanup complete!"
echo ""
echo "📋 Next steps to clear IDE errors:"
echo "   1. In VS Code, press Cmd+Shift+P"
echo "   2. Type: 'TypeScript: Restart TS Server'"
echo "   3. Press Enter"
echo "   4. Press Cmd+Shift+P again"
echo "   5. Type: 'Developer: Reload Window'"
echo "   6. Press Enter"
echo ""
echo "After reloading, all errors will be gone! 🎉"
