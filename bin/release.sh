#!/bin/bash

echo "🏷️  Creating release for NestJS application..."

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Ask for new version
read -p "Enter new version (current: $CURRENT_VERSION): " NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
    echo "❌ No version provided. Exiting..."
    exit 1
fi

# Update package.json version
echo "📝 Updating package.json version to $NEW_VERSION..."
npm version $NEW_VERSION --no-git-tag-version

# Build the application
echo "📦 Building application..."
yarn build

# Run tests
echo "🧪 Running tests..."
yarn test

# Build Docker image with version tag
echo "🐳 Building Docker image with tag $NEW_VERSION..."
docker build -t gauzy-app:$NEW_VERSION -f Dockerfile .
docker build -t gauzy-app:latest -f Dockerfile .

# Commit changes if git is available
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "📝 Committing version bump..."
    git add package.json package-lock.json
    git commit -m "chore: bump version to $NEW_VERSION"
    git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"
    echo "✅ Created git tag v$NEW_VERSION"
fi

echo "✅ Release $NEW_VERSION created successfully!"
echo "🐳 Docker images tagged: gauzy-app:$NEW_VERSION, gauzy-app:latest"
