"""Rename sound banks and files from the generated catalog.

Writes a manifest of every move so the rename is reversible independently of git.
Run with --apply to actually move; default is a dry run.
"""
import json, os, re, sys, subprocess

ROOT = 'server/sounds'
names = json.load(open('tools/soundcatalog/out/names.json'))

def safe(s):
    s = s.replace('/', '-')
    return re.sub(r'\s+', ' ', s).strip()

moves = []
for bank, v in sorted(names.items(), key=lambda kv: int(kv[0].split()[1])):
    n = int(bank.split()[1])
    olddir = os.path.join(ROOT, bank)
    newdir = os.path.join(ROOT, f"Bank {n:02d} - {safe(v['machine'])}")
    if not os.path.isdir(olddir):
        print(f"  MISSING {olddir}"); continue
    for ch, label in v['channels'].items():
        num = int(ch.split('-')[1])
        old = os.path.join(olddir, ch + '.wav')
        new = os.path.join(newdir, f"{num} {safe(label)}.wav")
        if os.path.exists(old):
            moves.append((old, new))
    for extra in ('info.txt',):
        p = os.path.join(olddir, extra)
        if os.path.exists(p):
            moves.append((p, os.path.join(newdir, extra)))
    moves.append(('__DIR__', olddir, newdir))

filemoves = [m for m in moves if m[0] != '__DIR__']
dirmoves  = [m for m in moves if m[0] == '__DIR__']
dests = [m[1] for m in filemoves]
dupes = {d for d in dests if dests.count(d) > 1}
print(f"{len(filemoves)} file moves, {len(dirmoves)} directory renames")
print(f"collisions: {len(dupes)}")
for d in list(dupes)[:5]: print("   ", d)
print("\nsample:")
for old, new in filemoves[:6]:
    print(f"  {old}\n    -> {new}")
print("  ...")
for old, new in filemoves[-3:]:
    print(f"  {old}\n    -> {new}")

if '--apply' in sys.argv and not dupes:
    manifest = []
    for _, olddir, newdir in dirmoves:
        if os.path.isdir(olddir) and olddir != newdir:
            subprocess.run(['git', 'mv', olddir, newdir], check=True)
            manifest.append([olddir, newdir])
    for old, new in filemoves:
        o = old.replace(os.path.dirname(old), os.path.dirname(new), 1) if False else None
    # after the dir rename, files live under the new dir
    for old, new in filemoves:
        oldnow = os.path.join(os.path.dirname(new), os.path.basename(old))
        if os.path.exists(oldnow) and oldnow != new:
            subprocess.run(['git', 'mv', oldnow, new], check=True)
            manifest.append([oldnow, new])
    json.dump(manifest, open('tools/soundcatalog/out/rename-manifest.json', 'w'), indent=1)
    print(f"\napplied {len(manifest)} moves; manifest written")
