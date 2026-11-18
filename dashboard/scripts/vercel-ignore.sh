#!/bin/sh
# Vercel ignoreCommand for the dashboard project.
# Exit 0 skips the build. Exit 1 runs the build.
# Build when dashboard/ changed. On any git error, build.
# :/dashboard is from the repo root, so the result does not depend on whether
# Vercel runs this from the repo root or from the dashboard/ directory.

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 1
fi
if ! git rev-parse "HEAD^" >/dev/null 2>&1; then
  exit 1
fi

if git diff --quiet "HEAD^" HEAD -- :/dashboard; then
  exit 0
fi
exit 1
