#!/bin/bash

# X-Clone API - Localhost Sharing Package Creator
# Creates a ZIP file with all necessary documentation for sharing

echo "╔════════════════════════════════════════════════════════╗"
echo "║   X-Clone API - Localhost Sharing Package Creator     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

PACKAGE_NAME="x-clone-api-localhost-$(date +%Y%m%d).zip"

echo "📦 Creating package: $PACKAGE_NAME"
echo ""

# Create package
zip -q $PACKAGE_NAME \
  LOCALHOST_SHARING_GUIDE.md \
  API_INTEGRATION_GUIDE.md \
  AUTHENTICATION_GUIDE.md \
  ENDPOINT_REFERENCE.txt \
  POSTMAN_COLLECTION.json \
  openapi.yaml \
  userpassword.md \
  automated_bearer_test.sh

echo "✅ Package created successfully!"
echo ""
echo "📋 Package contents:"
unzip -l $PACKAGE_NAME
echo ""
echo "📤 Share this file with your team:"
echo "   $PACKAGE_NAME"
echo ""
echo "📝 Instructions for recipients:"
echo "   1. Extract the ZIP file"
echo "   2. Read LOCALHOST_SHARING_GUIDE.md first"
echo "   3. Import POSTMAN_COLLECTION.json into Postman"
echo "   4. Update baseUrl to: http://localhost:3001/api"
echo "   5. Use test credentials from userpassword.md"
echo ""
echo "🌐 Share these URLs:"
echo "   API Base:     http://localhost:3001/api"
echo "   Swagger UI:   http://localhost:3001/docs"
echo "   Frontend:     http://localhost:5173"
echo ""
echo "✨ Done!"
