#!/bin/bash

# ============================================================================
# Drift Live Tracking - Setup Script
# ============================================================================
#
# This script automates the setup process for Firebase Hosting and
# the Live Tracking feature for the Drift rideshare application.
#
# Usage:
#   chmod +x setup-tracking.sh
#   ./setup-tracking.sh
#
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# Check Prerequisites
# ============================================================================

print_header "Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    echo "Please install Node.js v18 or later: https://nodejs.org"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Check Firebase CLI
if command -v firebase &> /dev/null; then
    FIREBASE_VERSION=$(firebase --version)
    print_success "Firebase CLI installed: $FIREBASE_VERSION"
else
    print_warning "Firebase CLI not installed"
    echo "Installing Firebase CLI..."
    npm install -g firebase-tools
    print_success "Firebase CLI installed"
fi

# Check Expo CLI
if command -v expo &> /dev/null || npx expo --version &> /dev/null; then
    print_success "Expo CLI available"
else
    print_warning "Expo CLI not found, will use npx"
fi

# ============================================================================
# Verify Project Structure
# ============================================================================

print_header "Verifying Project Structure"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the Drift project root?"
    exit 1
fi

if [ ! -d "functions" ]; then
    print_error "functions/ directory not found"
    exit 1
fi

print_success "Project structure verified"

# ============================================================================
# Create/Verify Public Directory
# ============================================================================

print_header "Setting Up Public Directory"

if [ ! -d "public" ]; then
    mkdir -p public
    print_success "Created public/ directory"
else
    print_success "public/ directory exists"
fi

# Check for required files
if [ -f "public/index.html" ]; then
    print_success "index.html exists"
else
    print_warning "index.html not found - you'll need to create it"
fi

if [ -f "public/track.html" ]; then
    print_success "track.html exists"
else
    print_warning "track.html not found - you'll need to create it"
fi

if [ -f "public/404.html" ]; then
    print_success "404.html exists"
else
    print_warning "404.html not found - you'll need to create it"
fi

# ============================================================================
# Install Dependencies
# ============================================================================

print_header "Installing Dependencies"

# Root dependencies
print_info "Installing root dependencies..."
npm install

# Functions dependencies
print_info "Installing functions dependencies..."
cd functions
npm install
cd ..

print_success "Dependencies installed"

# ============================================================================
# Install Expo Packages
# ============================================================================

print_header "Installing Expo Packages"

print_info "Installing expo-sms, expo-contacts, expo-clipboard, expo-haptics, expo-location..."

# Use npx to ensure we use the correct expo version
npx expo install expo-sms expo-contacts expo-clipboard expo-haptics expo-location

print_success "Expo packages installed"

# ============================================================================
# Build Functions
# ============================================================================

print_header "Building Cloud Functions"

cd functions
npm run build
cd ..

print_success "Functions built successfully"

# ============================================================================
# Firebase Setup
# ============================================================================

print_header "Firebase Configuration"

# Check if logged in to Firebase
if firebase projects:list &> /dev/null; then
    print_success "Firebase CLI authenticated"
else
    print_warning "Not logged in to Firebase"
    echo "Please log in to Firebase:"
    firebase login
fi

# Check current project
CURRENT_PROJECT=$(firebase use 2>&1 | grep -oP '(?<=Active Project: ).*' || echo "none")
if [ "$CURRENT_PROJECT" != "none" ]; then
    print_success "Active Firebase project: $CURRENT_PROJECT"
else
    print_warning "No active Firebase project"
    echo "Setting default project..."
    firebase use default || firebase use drift-cayman
fi

# ============================================================================
# Verify Configuration Files
# ============================================================================

print_header "Verifying Configuration Files"

if [ -f "firebase.json" ]; then
    print_success "firebase.json exists"

    # Check for hosting config
    if grep -q '"hosting"' firebase.json; then
        print_success "Hosting configuration found"
    else
        print_warning "Hosting configuration missing in firebase.json"
    fi
else
    print_error "firebase.json not found"
    exit 1
fi

if [ -f ".firebaserc" ]; then
    print_success ".firebaserc exists"
else
    print_warning ".firebaserc not found"
fi

if [ -f "firestore.rules" ]; then
    print_success "firestore.rules exists"
else
    print_warning "firestore.rules not found"
fi

if [ -f "firestore.indexes.json" ]; then
    print_success "firestore.indexes.json exists"
else
    print_warning "firestore.indexes.json not found"
fi

# ============================================================================
# Verify Tracking Files
# ============================================================================

print_header "Verifying Tracking Implementation Files"

# Cloud Functions
if [ -f "functions/src/tracking.ts" ]; then
    print_success "functions/src/tracking.ts exists"
else
    print_error "functions/src/tracking.ts not found"
fi

# Mobile Service
if [ -f "src/services/trackingService.ts" ]; then
    print_success "src/services/trackingService.ts exists"
else
    print_error "src/services/trackingService.ts not found"
fi

# Types
if [ -f "src/types/tracking.ts" ]; then
    print_success "src/types/tracking.ts exists"
else
    print_error "src/types/tracking.ts not found"
fi

# Modal Component
if [ -f "src/components/ShareTrackingModal.tsx" ]; then
    print_success "src/components/ShareTrackingModal.tsx exists"
else
    print_error "src/components/ShareTrackingModal.tsx not found"
fi

# ============================================================================
# Summary
# ============================================================================

print_header "Setup Complete!"

echo "Your Drift Live Tracking feature is ready for deployment."
echo ""
echo "Next steps:"
echo ""
echo "  1. Create/verify your public HTML files:"
echo "     - public/index.html (landing page)"
echo "     - public/track.html (tracking page)"
echo "     - public/404.html (error page)"
echo ""
echo "  2. Deploy to Firebase:"
echo "     npm run firebase:deploy:all"
echo ""
echo "  3. Or deploy individually:"
echo "     npm run firebase:deploy:hosting    # Hosting only"
echo "     npm run firebase:deploy:functions  # Functions only"
echo "     npm run firebase:deploy:rules      # Security rules"
echo ""
echo "  4. Test locally first:"
echo "     npm run firebase:serve"
echo ""
echo "  5. View logs:"
echo "     npm run firebase:logs"
echo ""
echo "Documentation:"
echo "  - DEPLOYMENT_GUIDE.md     - Full deployment instructions"
echo "  - QUICK_REFERENCE.md      - Commands and checklist"
echo "  - TRACKING_IMPLEMENTATION.md - Technical details"
echo ""
echo -e "${GREEN}Happy tracking! 🚗${NC}"
