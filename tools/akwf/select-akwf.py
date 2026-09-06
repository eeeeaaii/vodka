#!/usr/bin/env python3
#
# This file is part of Vodka.
#
# Vodka is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Vodka is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Vodka.  If not, see <https://www.gnu.org/licenses/>.

"""
Picks the wavetable library out of the AKWF-FREE corpus and writes akwf-list.txt.

The problem this solves: sorting 4358 waveforms by "harmonic complexity" and
taking the top N gives you N members of the same family. Measured on the first
cut of this library, all 50 waves were distinct at 0.95 spectral similarity but
collapsed into 8 groups at 0.85 -- lots of waves, not much variety.

So this picks for spread instead. Each destination folder draws from the AKWF
folders that match its character, and within that pool the waves are chosen by
farthest-point sampling: repeatedly take whichever candidate is furthest, in
spectral terms, from everything picked so far. The waves already in the library
seed that set, so a rerun keeps them and only adds what is genuinely different.

No dependencies -- the FFT is down there, and the corpus is a git clone:

    git clone --depth 1 --filter=blob:none --sparse \\
        https://github.com/KristofferKarlAxelEkstrand/AKWF-FREE.git /tmp/akwf-src
    cd /tmp/akwf-src && git sparse-checkout set AKWF

Then, from this directory:

    ./select-akwf.py                 write akwf-list.txt
    ./select-akwf.py --dry-run       print the picks, write nothing
    ./select-akwf.py --report        also print how much spread the result has

and ./fetch-akwf.sh downloads whatever the list gained.
"""

import cmath
import math
import os
import struct
import sys
import wave

CORPUS = '/tmp/akwf-src/AKWF'
HERE = os.path.dirname(os.path.abspath(__file__))
LIST = os.path.join(HERE, 'akwf-list.txt')

# Destination folder -> (how many to pick, AKWF source folders to pick them from).
# The names are what shows up in list-audio, so they are the ones you would
# actually reach for, not the ones the corpus happens to use.
GROUPS = [
	('voice',    20, ['AKWF_hvoice']),
	('organ',    15, ['AKWF_eorgan']),
	('epiano',   10, ['AKWF_epiano']),
	('piano',     7, ['AKWF_piano']),
	('fm',       15, ['AKWF_fmsynth']),
	('chip',     15, ['AKWF_oscchip', 'AKWF_c604']),
	('game',     15, ['AKWF_vgame', 'AKWF_vgamebasic']),
	('granular', 10, ['AKWF_granular']),
	('distorted',10, ['AKWF_distorted']),
	('theremin',  7, ['AKWF_theremin']),
	('birds',     5, ['AKWF_birds']),
	('strings',  10, ['AKWF_cello', 'AKWF_violin', 'AKWF_stringbox']),
	('bass',     10, ['AKWF_ebass', 'AKWF_dbass']),
	('winds',    12, ['AKWF_clarinett', 'AKWF_flute', 'AKWF_oboe', 'AKWF_altosax']),
	('plucked',  12, ['AKWF_aguitar', 'AKWF_eguitar', 'AKWF_clavinet', 'AKWF_pluckalgo']),
	('saw',      12, ['AKWF_bw_saw', 'AKWF_bw_sawbright', 'AKWF_bw_sawgap',
	                  'AKWF_bw_sawrounded']),
	('square',   10, ['AKWF_bw_squ', 'AKWF_bw_squrounded']),
	('sine',      6, ['AKWF_bw_sin', 'AKWF_sinharm']),
	('triangle',  5, ['AKWF_bw_tri']),
	# 'all' rather than a number: these four are the textbook saw/square/sine/
	# triangle, so they go in whether or not something else already sounds like
	# them -- they are what you reach for by name.
	('perfect', 'all', ['AKWF_bw_perfectwaves']),
	('blended',  10, ['AKWF_bw_blended']),
	('linear',    8, ['AKWF_linear']),
	('symmetric', 5, ['AKWF_symetric']),
	('overtone',  8, ['AKWF_overtone']),
	('hdrawn',    8, ['AKWF_hdrawn']),
]

NHARM = 128       # harmonics kept in the descriptor
FLOOR = -60.0     # dB below the loudest partial, past which we stop caring
MIN_SPREAD = 0.15 # a pick this close to something already in is a duplicate


# - -  fft  - -

def fft(x):
	"""
	Mixed-radix Cooley-Tukey. A cycle is 600 samples = 2^3 * 3 * 5^2, so radix
	2, 3 and 5 factor it completely and the naive fallback never runs.
	"""
	n = len(x)
	if n == 1:
		return list(x)
	radix = 0
	for f in (2, 3, 5, 7):
		if n % f == 0:
			radix = f
			break
	if radix == 0:
		return [sum(x[j] * cmath.exp(-2j * math.pi * k * j / n) for j in range(n))
				for k in range(n)]
	m = n // radix
	subs = [fft(x[r::radix]) for r in range(radix)]
	out = [0j] * n
	for k in range(m):
		for q in range(radix):
			kk = k + q * m
			acc = 0j
			for r in range(radix):
				acc += subs[r][k] * cmath.exp(-2j * math.pi * r * kk / n)
			out[kk] = acc
	return out


def readwave(path):
	w = wave.open(path, 'rb')
	frames = w.getnframes()
	chans = w.getnchannels()
	data = w.readframes(frames)
	w.close()
	vals = struct.unpack('<%dh' % (frames * chans), data)
	if chans > 1:
		vals = vals[::chans]
	return [v / 32768.0 for v in vals]


def descriptor(samples):
	"""
	One cycle, so DFT bin k is harmonic k exactly -- no windowing, no leakage.

	The comparison is done in dB rather than on raw amplitudes because a linear
	spectrum is all fundamental: two waves with completely different upper
	harmonics still look 99% alike if their fundamentals match. In dB the
	pattern of the overtones is what dominates the distance, which is much
	closer to what the ear is doing.
	"""
	mean = sum(samples) / len(samples)
	spec = fft([complex(v - mean) for v in samples])
	mags = [abs(spec[k]) for k in range(1, min(NHARM, len(spec) // 2) + 1)]
	peak = max(mags) if mags else 0.0
	if peak <= 0:
		return None
	db = []
	for m in mags:
		d = 20.0 * math.log10(m / peak) if m > 0 else FLOOR
		db.append(max(d, FLOOR) - FLOOR)
	norm = math.sqrt(sum(v * v for v in db))
	if norm <= 0:
		return None
	return [v / norm for v in db]


def distance(a, b):
	return math.sqrt(sum((x - y) * (x - y) for x, y in zip(a, b)))


def measure(samples):
	"""The columns in akwf-list.txt, kept so the file explains its own picks."""
	mean = sum(samples) / len(samples)
	spec = fft([complex(v - mean) for v in samples])
	mags = [abs(spec[k]) for k in range(1, len(spec) // 2 + 1)]
	peak = max(mags)
	strong = sum(1 for m in mags if m > 0 and 20 * math.log10(m / peak) > -40)
	energy = sum(mags)
	centroid = sum((i + 1) * m for i, m in enumerate(mags)) / energy if energy else 0
	loudest = mags.index(peak) + 1
	fund = mags[0] / peak if peak else 0
	return strong, centroid, loudest, fund


# - -  selection  - -

MARKER = '# - - picked for spread by select-akwf.py - -'


def hand_picked_section():
	"""
	The lines above the marker: waves chosen by hand (or by some earlier
	ranking) that this tool does not get to revisit.

	Seeding from the list rather than from whatever happens to be sitting in
	server/waves/ is what makes a rerun deterministic. If it seeded from the
	folder it would treat its own previous picks as fixed and go find 103 more,
	growing the library every time it ran.
	"""
	paths = []
	for line in open(LIST):
		if line.startswith(MARKER):
			break
		line = line.strip()
		if not line or line.startswith('#'):
			continue
		parts = line.split()
		if len(parts) >= 2:
			paths.append(parts[1])
	return paths


def seed_descriptors(corpus, paths):
	seeds = []
	for rel in paths:
		p = os.path.join(corpus, rel[len('AKWF/'):] if rel.startswith('AKWF/') else rel)
		if not os.path.isfile(p):
			print('select-akwf: WARNING seed not in corpus: ' + rel)
			continue
		v = descriptor(readwave(p))
		if v:
			seeds.append(v)
	return seeds


def main():
	dry = '--dry-run' in sys.argv
	report = '--report' in sys.argv
	min_spread = MIN_SPREAD
	if '--min-spread' in sys.argv:
		min_spread = float(sys.argv[sys.argv.index('--min-spread') + 1])
	corpus = CORPUS
	if '--corpus' in sys.argv:
		corpus = sys.argv[sys.argv.index('--corpus') + 1]

	if not os.path.isdir(corpus):
		print('select-akwf: no corpus at ' + corpus)
		print('select-akwf: clone it first, see the comment at the top of this file')
		return 1

	print('select-akwf: corpus is ' + corpus)
	print('select-akwf: reading the hand-picked section of akwf-list.txt')
	handpicked = hand_picked_section()
	seeds = seed_descriptors(corpus, handpicked)
	print('select-akwf: %d hand-picked waves, they seed the picking and are kept'
			% len(seeds))

	# a wave named up top is already in the library, so it is not a candidate
	seeded = set(os.path.basename(x) for x in handpicked)

	# analyse every candidate once
	pools = {}
	total = 0
	for name, count, sources in GROUPS:
		pool = []
		for src in sources:
			d = os.path.join(corpus, src)
			if not os.path.isdir(d):
				print('select-akwf: WARNING no such source folder: ' + src)
				continue
			for f in sorted(os.listdir(d)):
				if f.lower().endswith('.wav') and f not in seeded:
					pool.append((src, f, os.path.join(d, f)))
		print('select-akwf: analysing %-10s %4d candidates for %s slots'
				% (name, len(pool), count))
		vecs = []
		for src, f, p in pool:
			v = descriptor(readwave(p))
			if v:
				vecs.append((src, f, p, v))
		pools[name] = vecs
		total += len(vecs)
	print('select-akwf: %d candidate waves analysed' % total)

	# Farthest-point sampling, round-robin over the groups so that a group with
	# a big pool cannot take all the elbow room before a small one gets a turn.
	chosen = {name: [] for name, _, _ in GROUPS}
	picked = list(seeds)
	# min distance from each candidate to everything picked so far, kept
	# incrementally -- recomputing it every round is the slow way to do this
	best = {}
	for name, vecs in pools.items():
		best[name] = []
		for (src, f, p, v) in vecs:
			d = min((distance(v, s) for s in picked), default=float('inf'))
			best[name].append(d)

	print('select-akwf: picking')
	remaining = {name: (len(pools[name]) if count == 'all' else count)
			for name, count, _ in GROUPS}
	takeall = set(name for name, count, _ in GROUPS if count == 'all')
	skipped = {}
	order = [name for name, _, _ in GROUPS]
	progress = True
	while progress:
		progress = False
		for name in order:
			if remaining[name] <= 0:
				continue
			vecs = pools[name]
			already = set((c[0], c[1]) for c in chosen[name])
			bi, bd = -1, -1.0
			for i, (src, f, p, v) in enumerate(vecs):
				if (src, f) in already:
					continue
				if best[name][i] > bd:
					bi, bd = i, best[name][i]
			if bi < 0:
				remaining[name] = 0
				continue
			# Everything left in this pool is a near-copy of something already
			# in the library, so the remaining slots go unfilled rather than
			# spent on a wave that adds nothing.
			if bd < min_spread and name not in takeall:
				skipped[name] = remaining[name]
				remaining[name] = 0
				continue
			pick = vecs[bi]
			chosen[name].append(pick)
			remaining[name] -= 1
			progress = True
			picked.append(pick[3])
			print('select-akwf:   %-10s %-28s spread %.3f' % (name, pick[1], bd))
			# fold the new pick into every group's running minimum
			for gname, gvecs in pools.items():
				bl = best[gname]
				for i, (s2, f2, p2, v2) in enumerate(gvecs):
					d = distance(v2, pick[3])
					if d < bl[i]:
						bl[i] = d

	newlines = []
	for name, count, sources in GROUPS:
		for (src, f, p, v) in chosen[name]:
			strong, centroid, loudest, fund = measure(readwave(p))
			newlines.append('%-10s AKWF/%s/%-38s %4d %6.1f %4d %5.2f'
					% (name, src, f, strong, centroid, loudest, fund))

	print('select-akwf: picked %d new waves across %d folders'
			% (len(newlines), len(GROUPS)))
	if skipped:
		for name in sorted(skipped):
			print('select-akwf: %s left %d slot(s) unfilled -- nothing left in that '
					'pool is more than %.2f away from what is already in'
					% (name, skipped[name], min_spread))

	if report:
		print('select-akwf: --- before: the %d hand-picked waves alone ---'
				% len(seeds))
		spread_report(seeds)
		print('select-akwf: --- after: all %d waves ---' % len(picked))
		spread_report(picked)

	if dry:
		print('select-akwf: --dry-run, not writing ' + LIST)
		return 0

	old = open(LIST).read().rstrip('\n')
	if MARKER in old:
		old = old[:old.index(MARKER)].rstrip('\n')
	out = old + '\n\n' + MARKER + '\n' + '\n'.join(newlines) + '\n'
	open(LIST, 'w').write(out)
	print('select-akwf: wrote ' + LIST)
	print('select-akwf: now run ./fetch-akwf.sh to download the new waves')
	return 0


def spread_report(allvecs):
	"""How clustered is a set? Fewer groups at a threshold means narrower."""
	import itertools
	n = len(allvecs)
	if n < 2:
		return
	pairs = []
	for i, j in itertools.combinations(range(n), 2):
		# cosine similarity, to match how the first cut was measured
		a, b = allvecs[i], allvecs[j]
		pairs.append((sum(x * y for x, y in zip(a, b)), i, j))
	pairs.sort(reverse=True)
	for th in (0.95, 0.90, 0.85, 0.80):
		parent = list(range(n))
		def find(x):
			while parent[x] != x:
				parent[x] = parent[parent[x]]
				x = parent[x]
			return x
		for c, i, j in pairs:
			if c < th:
				break
			a, b = find(i), find(j)
			if a != b:
				parent[a] = b
		groups = len(set(find(i) for i in range(n)))
		print('select-akwf:   at similarity >= %.2f : %d distinct groups of %d'
				% (th, groups, n))


if __name__ == '__main__':
	sys.exit(main())
