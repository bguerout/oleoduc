#!/usr/bin/env bash
set -euo pipefail

readonly PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
readonly PRE_COMMIT_HOOK="${PROJECT_DIR}/.git/hooks/pre-commit"

cat <<'EOF' >"${PRE_COMMIT_HOOK}"
#!/usr/bin/env bash
set -euo pipefail
# Do not edit. This file has been generated by oleoduc

npm test
npm run lint
npm run build

EOF

chmod +x "${PRE_COMMIT_HOOK}"
echo "pre-push hooks installed in ${PRE_COMMIT_HOOK}"