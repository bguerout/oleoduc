#!/usr/bin/env bash
set -euo pipefail

readonly PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
readonly AUTH_TOKEN="${AUTH_TOKEN:?'AUTH_TOKEN env variable must exist'}"

function safeguard() {
  local release_version="${1}"

  echo "Checking if AUTH_TOKEN is valid..."
  NPM_CONFIG_TOKEN="${AUTH_TOKEN}" npm token list --json >/dev/null 2>&1 || {
    echo "AUTH_TOKEN is invalid"
    exit 1
  }
  echo "AUTH_TOKEN is valid and can be used to publish."

  while true; do
    read -p $'[WARN] Do you really want to publish version '"$release_version"$' (y/n) ?' yn
    case $yn in
    [Yy]*) break ;;
    [Nn]*) exit ;;
    *) echo "Please answer yes or no." ;;
    esac
  done
}

function clean_resources() {
  local repo_dir

  echo "Cleaning resources..."
  repo_dir="$(mktemp --dry-run)"
  pkill -P $$
  find "${TMPDIR:-"$(dirname "${repo_dir}")"}" -depth -type d -name "oleoduc" -exec rm -rf {} \;
}

function main() {
  local branch_name="${1:?"Please provide a branch name (eg. master)"}"
  local release_version
  local next_version
  local repo_dir
  local repo_url

  cd "${PROJECT_DIR}"
  release_version=$(node -e "console.log(require('./package.json').version);")
  repo_dir=$(mktemp -d -t "oleoduc-bare-repo-XXXXX")
  repo_url=$(git --git-dir "${PROJECT_DIR}/.git" config --get remote.origin.url)
  cd -

  safeguard "${release_version}"
  git clone "${repo_url}" "${repo_dir}"

  cd "${repo_dir}"
  echo "Preparing version to be released..."
  git checkout "${branch_name}"
  npm ci
  npm test

  echo "Creating release tag..."
  git tag -a "${release_version}" -m "Release ${release_version}"
  git push origin "${release_version}"

  echo "Publishing module into npm repository..."
  NPM_CONFIG_TOKEN="${AUTH_TOKEN}" npm publish

  echo "Preparing project for next release..."
  npm version patch --no-git-tag-version
  next_version=$(node -e "console.log(require('./package.json').version);")

  git add package.json package-lock.json
  git commit -m "Bump project version to ${next_version}"
  git push origin "${branch_name}"
  cd -
}

trap clean_resources EXIT HUP INT QUIT PIPE TERM
main "$@"
