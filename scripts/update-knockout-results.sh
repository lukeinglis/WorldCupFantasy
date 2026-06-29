#!/bin/bash
# Fetches current knockout results from production API and updates
# the hardcoded fallback in src/data/scoring.ts.
# Run from the repo root: ./scripts/update-knockout-results.sh

set -e

SCORING_FILE="src/data/scoring.ts"
API_URL="https://worldcup.lukeinglis.me/api/football/matches"

echo "Fetching knockout results from production API..."

RESULTS=$(curl -s "$API_URL" | python3 -c "
import json, sys

d = json.load(sys.stdin)
matches = d.get('matches', [])
if not matches:
    print('ERROR: No matches returned')
    sys.exit(1)

knockout_stages = ['round_of_32', 'round_of_16', 'quarter', 'semi', 'third_place', 'final']
knockout = [m for m in matches if m.get('stage', '') in knockout_stages and m.get('status') == 'FINISHED']

if not knockout:
    print('NO_RESULTS')
    sys.exit(0)

# Group by stage, sort by date, assign match numbers
from collections import defaultdict
by_stage = defaultdict(list)
for m in knockout:
    by_stage[m['stage']].append(m)

lines = []
for stage in knockout_stages:
    stage_matches = sorted(by_stage.get(stage, []), key=lambda m: m.get('utcDate', ''))
    for i, m in enumerate(stage_matches):
        match_num = i + 1
        winner_side = m.get('score', {}).get('winner', '')
        h = m.get('homeTeam', {}).get('tla', '?')
        a = m.get('awayTeam', {}).get('tla', '?')
        hs = m.get('score', {}).get('fullTime', {}).get('home', '?')
        as_ = m.get('score', {}).get('fullTime', {}).get('away', '?')

        if winner_side == 'HOME_TEAM':
            winner = h
        elif winner_side == 'AWAY_TEAM':
            winner = a
        else:
            continue

        date_str = m.get('utcDate', '')[:10]
        # Format date nicely
        from datetime import datetime
        try:
            dt = datetime.strptime(date_str, '%Y-%m-%d')
            date_nice = dt.strftime('%b %d').replace(' 0', ' ')
        except:
            date_nice = date_str

        lines.append(f'  \"{stage}_{match_num}\": \"{winner}\",  // {h} {hs}:{as_} {a} ({date_nice})')

print('\n'.join(lines))
")

if [ "$RESULTS" = "NO_RESULTS" ]; then
    echo "No finished knockout matches yet."
    exit 0
fi

if echo "$RESULTS" | grep -q "ERROR"; then
    echo "$RESULTS"
    exit 1
fi

echo ""
echo "Results found:"
echo "$RESULTS"
echo ""

# Write results to a temp file and use Python to do the replacement
TMPFILE=$(mktemp)
echo "$RESULTS" > "$TMPFILE"

python3 - "$SCORING_FILE" "$TMPFILE" <<'PYEOF'
import re, sys

scoring_file = sys.argv[1]
results_file = sys.argv[2]

with open(results_file, 'r') as f:
    results = f.read().strip()

with open(scoring_file, 'r') as f:
    content = f.read()

new_block = f"const HARDCODED_KNOCKOUT_RESULTS: Record<string, string> = {{\n{results}\n}};"
pattern = r'const HARDCODED_KNOCKOUT_RESULTS: Record<string, string> = \{[^}]*\};'
new_content = re.sub(pattern, new_block, content)

if new_content == content:
    print("WARNING: Pattern not found in scoring.ts, no changes made")
else:
    with open(scoring_file, 'w') as f:
        f.write(new_content)
    print(f"Updated {scoring_file}")
PYEOF

rm -f "$TMPFILE"

echo ""
echo "Done. Review changes with: git diff src/data/scoring.ts"
echo "Then commit with: git add src/data/scoring.ts && git commit -s -m 'Update hardcoded knockout results' && git push origin main"
