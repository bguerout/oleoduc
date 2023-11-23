#!/usr/bin/env bash
set -euo pipefail

readonly PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

rm -rf "${PROJECT_DIR}/dist"

cd "${PROJECT_DIR}"

echo "Building oleoduc (esm version)..."
tsc -p tsconfig.json
cat >"./dist/mjs/package.json" <<!EOF
{
    "type": "module"
}
!EOF

echo "Building oleoduc (cjs version)..."
tsc -p tsconfig.cjs.json
cat >"./dist/cjs/package.json" <<!EOF
{
    "type": "commonjs"
}
!EOF

cd -

