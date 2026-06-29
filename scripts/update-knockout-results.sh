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

# R32 matchups from our bracket (must match knockout-bracket.ts)
R32_BRACKET = [
    (1, 'RSA', 'CAN'), (2, 'NED', 'MAR'), (3, 'BRA', 'JPN'), (4, 'GER', 'PAR'),
    (5, 'CIV', 'NOR'), (6, 'FRA', 'SWE'), (7, 'MEX', 'ECU'), (8, 'USA', 'BIH'),
    (9, 'ENG', 'COD'), (10, 'BEL', 'SEN'), (11, 'ESP', 'AUT'), (12, 'POR', 'CRO'),
    (13, 'SUI', 'ALG'), (14, 'AUS', 'EGY'), (15, 'ARG', 'CPV'), (16, 'COL', 'GHA'),
]

TLA_MAP = {'CUW': 'CUR', 'URU': 'URY'}
def norm(tla):
    return TLA_MAP.get(tla, tla)

def find_r32_match_num(home, away):
    h, a = norm(home), norm(away)
    for num, bh, ba in R32_BRACKET:
        if (bh == h and ba == a) or (bh == a and ba == h):
            return num
    return None

# Group by stage, sort by date for later rounds
from collections import defaultdict
by_stage = defaultdict(list)
for m in knockout:
    by_stage[m['stage']].append(m)

lines = []
for stage in knockout_stages:
    stage_matches = sorted(by_stage.get(stage, []), key=lambda m: m.get('utcDate', ''))
    for i, m in enumerate(stage_matches):
        winner_side = m.get('score', {}).get('winner', '')
        h = m.get('homeTeam', {}).get('tla', '?')
        a = m.get('awayTeam', {}).get('tla', '?')
        hs = m.get('score', {}).get('fullTime', {}).get('home', '?')
        as_ = m.get('score', {}).get('fullTime', {}).get('away', '?')

        if winner_side == 'HOME_TEAM':
            winner = norm(h)
        elif winner_side == 'AWAY_TEAM':
            winner = norm(a)
        else:
            continue

        # For R32, match by team codes; for later rounds, use date order
        if stage == 'round_of_32':
            match_num = find_r32_match_num(h, a)
            if match_num is None:
                print(f'WARNING: R32 match {h} vs {a} not found in bracket', file=sys.stderr)
                continue
        else:
            match_num = i + 1

        date_str = m.get('utcDate', '')[:10]
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
