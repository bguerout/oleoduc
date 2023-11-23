#!/usr/bin/env bash
set -euo pipefail

readonly PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

cat >"${PROJECT_DIR}/dist/cjs/package.json" <<!EOF
{
    "type": "commonjs"
}
!EOF


cat >"${PROJECT_DIR}/dist/mjs/package.json" <<!EOF
{
    "type": "module"
}
!EOF
