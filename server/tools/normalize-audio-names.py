#!/usr/bin/env python3
"""
Renames everything in the audio libraries to something you can type after a dot.

A listing from list-audio is walked with vodka's dot syntax --

    ~(_bind @audio ~(_list-audio_)_)   then   @audio.sample.SB_003.Wobble_Tone

-- and each step of that is a tag looked up by name, so every folder and file
name has to be a legal symbol. Vodka's parser allows [a-zA-Z0-9:._-] in a
symbol; a dot separates the steps and a colon separates packages, so neither
can appear inside a name either. That leaves letters, digits, underscore and
hyphen, and this renames anything else.

Idempotent: a name that is already legal is left alone, so it is safe to rerun
after adding samples.
"""

import os, re, sys

ROOTS = ['sounds', 'waves']
LEGAL = re.compile(r'^[A-Za-z0-9_-]+$')


def normalize(base):
	"""base is a name with any .wav already taken off the end."""
	# parens around a duration read as grouping, and what is inside them is
	# worth keeping -- Bass Sweep (7s) is a different sample from Bass Sweep
	base = base.replace('(', ' ').replace(')', ' ')
	base = re.sub(r'[^A-Za-z0-9_-]', '_', base)
	base = re.sub(r'_+', '_', base)
	return base.strip('_')


def rename_in(root, dry_run):
	renamed = skipped = 0
	collisions = []
	# deepest first, so renaming a folder cannot invalidate a path we are
	# still holding for something inside it
	for dirpath, dirnames, filenames in os.walk(root, topdown=False):
		for name in dirnames + filenames:
			if name.startswith('.'):
				continue
			isdir = name in dirnames
			stem, ext = os.path.splitext(name)
			# only folders and audio are ever named in vodka; the info.txt
			# saying which machine a bank came from is read by people
			if not isdir and ext.lower() != '.wav':
				continue
			if isdir:
				stem, ext = name, ''
			new = normalize(stem)
			if not new:
				print('  SKIP  cannot make a name out of ' + os.path.join(dirpath, name))
				continue
			newname = new + ext
			if newname == name:
				skipped += 1
				continue
			src = os.path.join(dirpath, name)
			dst = os.path.join(dirpath, newname)
			if os.path.exists(dst):
				collisions.append((src, dst))
				print('  CLASH ' + src + '  ->  ' + newname + '  (already exists, left alone)')
				continue
			print('  ' + src + '  ->  ' + newname)
			if not dry_run:
				os.rename(src, dst)
			renamed += 1
	return renamed, skipped, collisions


def main():
	dry_run = '--dry-run' in sys.argv
	print('normalize-audio-names: ' + ('DRY RUN, nothing will be renamed'
			if dry_run else 'renaming for real'))
	total = 0
	all_collisions = []
	for root in ROOTS:
		if not os.path.isdir(root):
			print('normalize-audio-names: no ' + root + '/ here -- run this from server/')
			return 1
		print('normalize-audio-names: walking ' + root + '/')
		renamed, skipped, collisions = rename_in(root, dry_run)
		all_collisions += collisions
		total += renamed
		print('normalize-audio-names: ' + root + ': ' + str(renamed)
				+ ' renamed, ' + str(skipped) + ' already fine')

	# the point of the whole exercise, so check it rather than assume it
	bad = []
	if dry_run:
		print('normalize-audio-names: dry run, so nothing was checked afterwards')
		return 0
	for root in ROOTS:
		for dirpath, dirnames, filenames in os.walk(root):
			for name in dirnames + filenames:
				if name.startswith('.'):
					continue
				stem, ext = os.path.splitext(name)
				if ext.lower() != '.wav':
					continue
				if not LEGAL.match(stem):
					bad.append(os.path.join(dirpath, name))
			for d in dirnames:
				if not LEGAL.match(d):
					bad.append(os.path.join(dirpath, d))
	print('normalize-audio-names: ' + str(total) + ' renamed in total')
	if all_collisions:
		print('normalize-audio-names: ' + str(len(all_collisions))
				+ ' NAME CLASHES, listed above -- these need names by hand')
	if bad:
		print('normalize-audio-names: ' + str(len(bad))
				+ ' names still not legal:')
		for b in bad[:20]:
			print('    ' + b)
	else:
		print('normalize-audio-names: every folder and wav name is a legal symbol')
	return 1 if (bad or all_collisions) else 0


sys.exit(main())
