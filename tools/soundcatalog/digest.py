"""Compact per-bank view: machine name + acoustics + CLAP labels, for hand-inference."""
import json, sys, os, re

ROOT='/home/eeeeaaii/repos/vodka/server/sounds'
feats=json.load(open('/home/eeeeaaii/repos/vodka/tools/soundcatalog/out/features.json'))
labels={e['file']: e for e in json.load(open('/home/eeeeaaii/repos/vodka/tools/soundcatalog/out/labels.json'))}

def banknum(p):
    m=re.search(r'Bank (\d+)', p); return int(m.group(1)) if m else 0

bybank={}
for f in feats:
    bybank.setdefault(banknum(f), []).append(f)

lo,hi=int(sys.argv[1]), int(sys.argv[2])
for b in sorted(bybank):
    if not (lo<=b<=hi): continue
    info=''
    p=os.path.join(ROOT,f'Bank {b}','info.txt')
    if os.path.exists(p): info=open(p).read().strip()
    print(f"\n=== Bank {b}  [{info}] ===")
    for f in sorted(bybank[b]):
        x=feats[f]
        if 'error' in x: print(f"  {os.path.basename(f):<12} ERROR"); continue
        L=labels.get(f)
        inst=mat=art=char=''
        if L:
            inst=L['facets']['instrument'][0]['label'].replace('a ','').replace('an ','')
            i2=L['facets']['instrument'][1]['label'].replace('a ','').replace('an ','')
            art=L['facets']['articulation'][0]['label'].replace('a ','').replace('an ','')
            char=L['facets']['character'][0]['label']
            inst=f"{inst}/{i2}"
        print(f"  {os.path.basename(f):<12} {x['dur']:6.2f}s cent{x['cent']:>6} f0{x['f0']:>5} lo/mid/hi {x['lo']:.2f}/{x['mid']:.2f}/{x['hi']:.2f} "
              f"flat{x['flat']:.2f} sus{x['sustain']:.2f} per{x['periodic']:.2f} | {inst:<34} {art:<24} {char}")
