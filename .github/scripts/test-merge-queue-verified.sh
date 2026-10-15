#!/usr/bin/env bash

# Offline cases for merge-queue-verified.sh, with `gh` replaced by a stub that
# answers from fixtures. checks.yml's push run skips the whole suite when this
# predicate says `verified=true`, so the cases that matter are the refusals:
# only a green merge_group run of checks.yml, for this exact SHA, in this repo,
# whose `CI complete` is green, may vouch for a commit — and an API failure must
# exit non-zero, never read as a quiet "not verified" (or worse, a yes).
# Ported from OxyHQ/Mention's test-release-provenance.sh.

set -euo pipefail

predicate="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/merge-queue-verified.sh"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
failures=0
sha=0123456789abcdef0123456789abcdef01234567

mkdir -p "$work/bin"
cat >"$work/bin/gh" <<'STUB'
#!/usr/bin/env bash
# Answers `gh api [--paginate] <path>` from $FIXTURES.
path="${@: -1}"
case "$path" in
  *"/actions/workflows/checks.yml/runs?"*) file="$FIXTURES/runs.json" ;;
  *"/actions/runs/"*"/jobs?"*) id="${path#*/actions/runs/}"; file="$FIXTURES/jobs-${id%%/*}.json" ;;
  *) echo "unexpected gh call: $*" >&2; exit 2 ;;
esac
[[ -f "$FIXTURES/fail" ]] && { echo "HTTP 502" >&2; exit 1; }
cat "$file"
STUB
chmod +x "$work/bin/gh"

fixture() {
  # fixture <name> <runs-json> [<run-id> <jobs-json>]...
  local dir="$work/$1"
  mkdir -p "$dir"
  printf '%s' "$2" >"$dir/runs.json"
  shift 2
  while [[ $# -gt 0 ]]; do
    printf '%s' "$2" >"$dir/jobs-$1.json"
    shift 2
  done
}

run_json() {
  local id="$1" event="$2" conclusion="$3" repo="${4:-OxyHQ/website}" path="${5:-.github/workflows/checks.yml}" head="${6:-$sha}"
  printf '{"id":%s,"event":"%s","conclusion":"%s","head_sha":"%s","path":"%s","head_repository":{"full_name":"%s"}}' \
    "$id" "$event" "$conclusion" "$head" "$path" "$repo"
}
jobs_json() { printf '{"jobs":[{"name":"checks","conclusion":"success"},{"name":"CI complete","conclusion":"%s"}]}' "$1"; }

fixture verified "{\"workflow_runs\":[$(run_json 11 merge_group success)]}" 11 "$(jobs_json success)"
fixture none '{"workflow_runs":[]}'
fixture failed-run "{\"workflow_runs\":[$(run_json 12 merge_group failure)]}" 12 "$(jobs_json success)"
fixture red-gate "{\"workflow_runs\":[$(run_json 13 merge_group success)]}" 13 "$(jobs_json failure)"
fixture other-sha "{\"workflow_runs\":[$(run_json 14 merge_group success OxyHQ/website .github/workflows/checks.yml fedcba9876543210fedcba9876543210fedcba98)]}" 14 "$(jobs_json success)"
fixture other-workflow "{\"workflow_runs\":[$(run_json 15 merge_group success OxyHQ/website .github/workflows/evil.yml)]}" 15 "$(jobs_json success)"
fixture fork "{\"workflow_runs\":[$(run_json 16 merge_group success someone/website)]}" 16 "$(jobs_json success)"
fixture pull-request "{\"workflow_runs\":[$(run_json 17 pull_request success)]}" 17 "$(jobs_json success)"
fixture push-run "{\"workflow_runs\":[$(run_json 19 push success)]}" 19 "$(jobs_json success)"
fixture api-down '{"workflow_runs":[]}'
touch "$work/api-down/fail"
# The run list answers, the jobs call fails: must still be red.
fixture jobs-down "{\"workflow_runs\":[$(run_json 18 merge_group success)]}"

# Prints "<exit> [<stdout>] <outputs>".
run_predicate() {
  local name="$1" output_file="$work/output" status=0 stdout
  shift
  : >"$output_file"
  stdout="$(env -i PATH="$work/bin:$PATH" FIXTURES="$work/$name" GITHUB_OUTPUT="$output_file" \
    GITHUB_REPOSITORY=OxyHQ/website DEPLOY_SHA="$sha" "$@" bash "$predicate" 2>/dev/null)" || status=$?
  echo "$status [$stdout] $(tr '\n' ' ' <"$output_file")"
}

expect() {
  local case_name="$1" want="$2" got="$3"
  if [[ "$got" != "$want" ]]; then
    echo "FAIL $case_name: want '$want', got '$got'" >&2
    failures=$((failures + 1))
  fi
}

expect 'verified' '0 [11] verified=true ' "$(run_predicate verified)"
expect 'none' '0 [] verified=false ' "$(run_predicate none)"
for name in failed-run red-gate other-sha other-workflow fork pull-request push-run; do
  expect "$name-does-not-verify" '0 [] verified=false ' "$(run_predicate "$name")"
done
expect 'api-down-fails' '1 [] ' "$(run_predicate api-down)"
expect 'jobs-down-fails' '1 [] ' "$(run_predicate jobs-down)"
expect 'short-sha-refused' '1 [] ' "$(run_predicate verified DEPLOY_SHA="${sha:0:12}")"

if [[ "$failures" -gt 0 ]]; then
  echo "$failures merge-queue-verified case(s) failed" >&2
  exit 1
fi
echo "merge-queue-verified: all cases passed"
