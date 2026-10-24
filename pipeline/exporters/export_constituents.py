"""ASX 100 constituent changes — which stocks left (and joined) the index.

Makes the AGL peer-group changes explicit: between each 30-June snapshot, which
names dropped OUT of the S&P/ASX 100 (the peers AGL is measured against) and which
came IN. Emits frontend/public/data/tsr/constituent-changes.json.
"""

import os
import json
import sqlite3

from pipeline.data.asx100_constituents import get_constituent_changes

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
OUT_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data', 'tsr', 'constituent-changes.json')


# Names for index names not in the tracked universe (mostly since taken over / delisted)
FALLBACK = {
    'AKE.AX': 'Allkem (merged → Arcadium)', 'AWC.AX': 'Alumina (acquired by Alcoa)',
    'NCM.AX': 'Newcrest Mining (acquired by Newmont)', 'ALU.AX': 'Altium (acquired by Renesas)',
    'IPL.AX': 'Incitec Pivot', 'LTM.AX': 'Arcadium Lithium (acquired by Rio Tinto)',
    'SQ2.AX': 'Block Inc (CDIs delisted)', 'SVW.AX': 'Seven Group Holdings (privatised)',
    'VUK.AX': 'Virgin Money UK (acquired)', 'PMI.AX': 'Pengana / index change',
    'DNL.AX': 'Dyno Nobel', 'XYZ.AX': 'Block Inc', 'SGH.AX': 'Seven Group Holdings',
}


def main():
    conn = sqlite3.connect(DB_PATH)
    names = {r[0]: r[1] for r in conn.execute("SELECT ticker, name FROM stocks")}

    def label(t):
        short = t.replace('.AX', '')
        nm = names.get(t)
        if not nm or nm == short:          # placeholder name (delisted) → use fallback
            nm = FALLBACK.get(t, short)
        return {'ticker': short, 'name': nm}

    out = []
    for c in get_constituent_changes():
        out.append({
            'from': c['from'], 'to': c['to'],
            'entered': [label(t) for t in sorted(c['entered'])],
            'exited': [label(t) for t in sorted(c['exited'])],
        })

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w') as f:
        json.dump(out, f, indent=2)
    print(f"Exported {len(out)} ASX 100 constituent transitions → {OUT_PATH}")


if __name__ == '__main__':
    main()
