#!/usr/bin/env bash
set -euo pipefail

readonly PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
readonly BUILD_DIR="${PROJECT_DIR}/build"
readonly DIST_DIR="${PROJECT_DIR}/dist"

rm -rf "${DIST_DIR}" "${BUILD_DIR}"
mkdir -p "${DIST_DIR}" "${BUILD_DIR}"

cd "${PROJECT_DIR}"

echo "Compiling oleoduc (esm version)..."
tsc -p tsconfig.json
cat >"${DIST_DIR}/mjs/package.json" <<!EOF
{
    "type": "module"
}
!EOF

echo "Compiling oleoduc (cjs version)..."
tsc -p tsconfig.cjs.json
cat >"${DIST_DIR}/cjs/package.json" <<!EOF
{
    "type": "commonjs"
}
!EOF

echo "Building oleoduc for test..."
tsc -p tsconfig.test.json
echo "Patching package.json to be able to run tests against previous versions of nodejs..."
cp "${PROJECT_DIR}/package.json" "${BUILD_DIR}"
npx json -I -f "${BUILD_DIR}/package.json" -e 'this.scripts.test="mocha --recursive --exit test/**/*-test.js"'
npx json -I -f "${BUILD_DIR}/package.json" -e 'this.devDependencies.mocha="9.x"'

cd -

