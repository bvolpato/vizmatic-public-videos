#!/usr/bin/env bash
# Build the exact Vizmatic revision pinned in package.json and link it at node_modules/vizmatic.
set -euo pipefail
cd "$(dirname "$0")/.."

spec=$(node -p "require('./package.json').dependencies.vizmatic")
rev="${spec##*#}"
if [[ -z "$rev" || "$rev" == "$spec" ]]; then
    echo "Expected github:owner/repo#<rev> in package.json, got: $spec" >&2
    exit 1
fi

cache_dir="${VIZMATIC_CACHE_DIR:-$PWD/.cache/vizmatic-$rev}"
if [[ ! -x "$cache_dir/dist/cli.js" ]]; then
    rm -rf "$cache_dir"
    mkdir -p "$(dirname "$cache_dir")"
    git clone --filter=blob:none --no-checkout https://github.com/bvolpato/vizmatic.git "$cache_dir"
    git -C "$cache_dir" checkout --detach "$rev"
    (cd "$cache_dir" && pnpm install --frozen-lockfile && pnpm build)
fi

mkdir -p node_modules
ln -sfn "$cache_dir" node_modules/vizmatic
echo "Linked node_modules/vizmatic -> $cache_dir"
