#!/usr/bin/env bash
set -euo pipefail

readonly PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
readonly BUILD_DIR="${PROJECT_DIR}/build"
readonly DIST_DIR="${PROJECT_DIR}/dist"

rm -rf "${DIST_DIR}" "${BUILD_DIR}"
mkdir -p "${DIST_DIR}" "${BUILD_DIR}"

cd "${PROJECT_DIR}"

npm run lint

echo "Compiling oleoduc (esm version)..."
npm run tsc -- -p tsconfig.json
cat >"${DIST_DIR}/esm/package.json" <<!EOF
{
    "type": "module"
}
!EOF

echo "Compiling oleoduc (cjs version)..."
npm run tsc -- -p tsconfig.cjs.json
cat >"${DIST_DIR}/cjs/package.json" <<!EOF
{
    "type": "commonjs"
}
!EOF

echo "Compiling oleoduc (types)..."
npm run tsc -- -p tsconfig.types.json

echo "Building oleoduc for test..."
npm run tsc -- -p tsconfig.test.json
echo "Patching package.json to be able to run tests against previous versions of nodejs..."
cp "${PROJECT_DIR}/package.json" "${BUILD_DIR}"
npx json -I -f "${BUILD_DIR}/package.json" -e 'this.type="commonjs"'
npx json -I -f "${BUILD_DIR}/package.json" -e 'this.devDependencies.mocha="9.x"'
npx json -I -f "${BUILD_DIR}/package.json" -e 'this.scripts.test="mocha --recursive --exit test/**/*-test.js"'
cat >"${BUILD_DIR}/.mocharc.json" <<!EOF
{}
!EOF
cd -

