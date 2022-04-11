/*
This file is part of Vodka.

Vodka is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vodka is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
*/
import * as Utils from '../utils.js'

import { Wavetable } from '../nex/wavetable.js'; 
import { Builtin } from '../nex/builtin.js'; 
import { Integer } from '../nex/integer.js'; 
import { Org } from '../nex/org.js'; 
import { Float } from '../nex/float.js'; 
import { EString } from '../nex/estring.js'; 
import { UNBOUND } from '../environment.js'
import {
	convertValueFromTag,
	convertTimeToSamples,
	setBpm,
	nexToTimebase,
	getReferenceFrequency,
	getSampleRate,
	getConstantSignalFromValue } from '../wavetablefunctions.js'
import { loopPlay, oneshotPlay, abortPlayback, startRecordingAudio, stopRecordingAudio } from '../webaudio.js'
import { Tag } from '../tag.js'
import { EError } from '../nex/eerror.js'
import { ERROR_TYPE_INFO } from '../nex/eerror.js'
import { Nil } from '../nex/nil.js'
import { Command } from '../nex/command.js'; 
import { evaluateNexSafely, wrapError } from '../evaluator.js'



function createWavetableBuiltins() {

	Builtin.createBuiltin(
		'set-default-timebase',
		[ 'a' ],
		function $setDefaultTimebase(env, executionEnvironment) {
			let a = env.lb('a');
			setDefaultTimebase(a);
			return new Nil();
		},
		'looks at the tags on |a and sets the default timebase based on their values.'
	);

	Builtin.createBuiltin(
		'start-recording-into',
		[ '_wt'],
		function $recordInto(env, executionEnvironment) {
			let wt = env.lb('wt');
			startRecordingAudio(wt);
			return wt;
		},
		'starts recording audio into the wavetable.'
	);


	Builtin.createBuiltin(
		'stop-recording',
		[ '_wt'],
		function $stopRecording(env, executionEnvironment) {
			let wt = env.lb('wt');
			stopRecordingAudio(wt);
 			return wt;
		},
		'starts recording audio into the wavetable.'
	);

	Builtin.createBuiltin(
		'oneshot-play',
		[ 'wt', 'channel#?' ],
		function $oneshotPlay(env, executionEnvironment) {
			let wt = env.lb('wt');
			let channel = env.lb('channel');
			if (channel == UNBOUND) {
				channel = new Integer(0);
			}
			let channelnumber = channel.getTypedValue();


			oneshotPlay(wt.getData(), channelnumber);
			return wt;
		},
		'plays the sound immediately on the given channel'
	);

	Builtin.createBuiltin(
		'abort-playback',
		[ 'channel#?' ],
		function $abortPlayback(env, executionEnvironment) {
			let channel = env.lb('channel');
			if (channel == UNBOUND) {
				channel = new Integer(0);
			}
			let channelnumber = channel.getTypedValue();

			abortPlayback(channelnumber);
			return new Nil();
		},
		'starts playing the sound at the next measure start'
	);


	Builtin.createBuiltin(
		'loop-play',
		[ 'wt', 'channel#?' ],
		function $loopPlay(env, executionEnvironment) {
			let wt = env.lb('wt');
			let channel = env.lb('channel');
			if (channel == UNBOUND) {
				channel = new Integer(0);
			}
			let channelnumber = channel.getTypedValue();

			loopPlay(wt.getData(), channelnumber);
			return wt;
		},
		'starts playing the sound at the next measure start'
	);

	Builtin.createBuiltin(
		'split',
		[ 'wt' ],
		function $play(env, executionEnvironment) {
			let wt = env.lb('wt');
			let r = new Org();
			for (let i = 0 ; i < wt.numSections(); i++) {
				let sd = wt.getSectionData(i);
				let w = new Wavetable();
				w.initWith(sd.data);		
				r.appendChild(w);		
			}
			return r;
		},
		'splits a wavetable into smaller sections based on markers added in wavetable editor'
	);


	Builtin.createBuiltin(
		'wavefold',
		[ 'wt'],
		function $reverse(env, executionEnvironment) {
			let wt = env.lb('wt');

			let data = [];
			let dur = wt.getDuration();
			for (let i = 0; i < dur; i++) {
				let val = wt.valueAtSample(i);
				while(val > 1 || val < -1) {
					if (val > 1) {
						val = 1 - (val - 1);
					}
					if (val < -1) {
						val = -1 + (-(val + 1)); // this math makes sense to me
					}
				}
				data[i] = val;
			}
			let r = new Wavetable();
			r.initWith(data);
			return r;
		},
		'reverses wavetable |wt'
	);	

	Builtin.createBuiltin(
		'reverse',
		[ 'wt'],
		function $reverse(env, executionEnvironment) {
			let wt = env.lb('wt');

			let data = [];
			let dur = wt.getDuration();
			for (let i = 0; i < dur; i++) {
				data[i] = wt.valueAtSample(dur - i);
			}
			let r = new Wavetable();
			r.initWith(data);
			return r;
		},
		'reverses wavetable |wt'
	);

	Builtin.createBuiltin(
		'constant',
		[ 'val#%?', 'dur#%?' ],
		function $const(env, executionEnvironment) {
			let dur = env.lb('dur');
			let val = env.lb('val');

			if (dur == UNBOUND) {
				dur = new Integer(256);
				dur.addTag(new Tag('samples'))
			}
			if (val == UNBOUND) {
				val = 1.0;
			} else {
				val = convertValueFromTag(val);
			}
			dur = convertTimeToSamples(dur);

			return getConstantSignalFromValue(val, dur);
		},
		'returns |dur samples of a constant value |val'
	);

	Builtin.createBuiltin(
		'singlepole',
		[ 'wt1', 'wt2' ],
		function $singlepole(env, executionEnvironment) {
			let wt1 = env.lb('wt1');
			let wt2 = env.lb('wt2');

			if (!(wt2.getTypeName() == '-wavetable-')) {
				wt2 = getConstantSignalFromValue(wt2.getTypedValue(), wt1.getDuration())
			}	

			let data = [];
			let dur = Math.max(wt1.getDuration(), wt2.getDuration());
			let yk = wt1.valueAtSample(0);

			let cutoffAtOne = 20000;
			let timeconstant = 1/getSampleRate();

			for (let i = 0 ; i < dur; i++) {
				let wt1val = wt1.valueAtSample(i);
				let wt2val = wt2.valueAtSample(i);
				let cutoff = wt2val * cutoffAtOne;
				let tau = 1/cutoff;
				let alpha = timeconstant / tau;
				yk += alpha * (wt1val - yk);
				data[i] = yk;
			}
			let r = new Wavetable();
			r.initWith(data);
			return r;
		},
		'runs |wt1 through a single pole filter with a cutoff determined by |wt2'
	);	

	Builtin.createBuiltin(
		'slew',
		[ 'wt1', 'wt2' ],
		function $singlepole(env, executionEnvironment) {
			let wt1 = env.lb('wt1');
			let wt2 = env.lb('wt2');

			if (!(wt2.getTypeName() == '-wavetable-')) {
				wt2 = getConstantSignalFromValue(wt2.getTypedValue(), wt1.getDuration())
			}	

			let data = [];
			let dur = Math.max(wt1.getDuration(), wt2.getDuration());

			let previousValue = wt1.valueAtSample(0);
			data[0] = previousValue;
			for (let i = 1 ; i < dur; i++) {
				let thisval = wt1.valueAtSample(i);
				let maxchange = Math.max(0, wt2.valueAtSample(i));

				let diff = thisval - previousValue;

				if (diff > maxchange) {
					data[i] = previousValue + maxchange;
				} else if (diff < -maxchange) {
					data[i] = previousValue - maxchange;
				} else {
					data[i] = thisval;
				}
				previousValue = data[i];
			}
			let r = new Wavetable();
			r.initWith(data);
			return r;
		},
		'slows down rate of change of |wt1 to a maximum value per sample given by |wt2'
	);	

	Builtin.createBuiltin(
		'wavecalc',
		[ 'wt', 'f&' ],
		function $const(env, executionEnvironment) {
			let wt = env.lb('wt');
			let f = env.lb('f');

			let data = [];
			let dur = wt.getDuration();
			for (let i = 0 ; i < dur; i++) {
				let v = new Float(wt.valueAtSample(i));
				let cmd = Command.makeCommandWithClosureOneArg(f, Command.quote(v));
				cmd.setSkipAlertAnimation(true);
				let result = evaluateNexSafely(cmd, executionEnvironment);
				if (Utils.isFatalError(result)) {
					return wrapError('&szlig;', `wavecalc: error returned from function`, result);
				}
				if (result.getTypeName() != '-float-') {
					return new EError('for: function must return a float');
				}
				data[i] = result.getTypedValue();
			}
			let r = new Wavetable();
			r.initWith(data);
			return r;
		},
		'calls function |f on every sample in |wt (this may take a while for long samples)'
	);	

	Builtin.createBuiltin(
		'noise',
		[ 'dur#%?' ],
		function $noise(env, executionEnvironment) {
			let dur = env.lb('dur');
			if (dur == UNBOUND) {
				dur = new Integer(getReferenceFrequency());
				dur.addTag(new Tag('hz'))
			}
			dur = convertTimeToSamples(dur);

			let wt = new Wavetable();
			let data = [];
			for (let i = 0; i < dur; i++) {
				let n = Math.random() * 2.0 - 1.0;
				data[i] = n;
			}
			wt.initWith(data);
			return wt;
		},
		'returns dur samples (or seconds, etc) of white noise'
	);

	Builtin.createBuiltin(
		'sinewave',
		[ 'dur#%?' ],
		function $sinewave(env, executionEnvironment) {
			let dur = env.lb('dur');
			if (dur == UNBOUND) {
				dur = new Integer(getReferenceFrequency());
				dur.addTag(new Tag('hz'))
			}

			let sampPerCycle = convertTimeToSamples(dur);

			let data = [];
			for (let i = 0; i < sampPerCycle; i++) {
				let d = Math.sin((i / sampPerCycle) * 2 * Math.PI);
				data[i] = d;
			}
			let wt = new Wavetable();
			wt.initWith(data);
			return wt;
		},
		'returns a wavetable of a sine wave'
	);

	Builtin.createBuiltin(
		'gate',
		[ 'nn#%?' ],
		function $squarewave(env, executionEnvironment) {
			let nn = env.lb('nn');
			if (nn == UNBOUND) {
				nn = new Integer(1);
				nn.addTag(new Tag('b'))
			}

			let dur = convertTimeToSamples(nn);

			let data = [];

			for (let i = 0; i < dur; i++) {
				if (i < (dur/2)) {
					data[i] = 0;
				} else {
					data[i] = 1;
				}
			}
			let wt = new Wavetable();
			wt.initWith(data);
			return wt;
		},
		'returns a wavetable of a gate signal'
	);	

	Builtin.createBuiltin(
		'squarewave',
		[ 'nn#%?' ],
		function $squarewave(env, executionEnvironment) {
			let nn = env.lb('nn');
			if (nn == UNBOUND) {
				nn = new Integer(getReferenceFrequency());
				nn.addTag(new Tag('hz'))
			}

			let sampPerCycle = convertTimeToSamples(nn);

			let data = [];

			let numHarmonics = 16;
			let freq = (1 / sampPerCycle) * getSampleRate();
			for (let i = 0; i < sampPerCycle; i++) {
				let omega = 2 * Math.PI * freq;
				// time in seconds of how far we are in the wave
				let time = (1 / getSampleRate()) * i;

				let s = 0;
				for (let k = 1 ; k <= numHarmonics ; k++) {
					let oddnum = (k * 2) - 1;
					let v = (1 / oddnum) * Math.sin(oddnum * omega * time);
					s += v;
				}
				data[i] = s * (4 / Math.PI);

			}
			let wt = new Wavetable();
			wt.initWith(data);
			return wt;
		},
		'returns a wavetable of a square wave'
	);

	Builtin.createBuiltin(
		'sawwave',
		[ 'nn#%?' ],
		function $sawwave(env, executionEnvironment) {
			let nn = env.lb('nn');
			if (nn == UNBOUND) {
				nn = new Integer(getReferenceFrequency());
				nn.addTag(new Tag('hz'))
			}

			let sampPerCycle = convertTimeToSamples(nn);

			let data = [];
			for (let i = 0; i < sampPerCycle; i++) {
				let d = (i / sampPerCycle);
				data[i] = d;
			}
			let wt = new Wavetable();
			wt.initWith(data);
			return wt;
		},
		'returns a wavetable of a saw wave'
	);

	Builtin.createBuiltin(
		'ramp',
		[ 'dur#%?' ],
		function $ramp(env, executionEnvironment) {
			let dur = env.lb('dur');
			if (dur == UNBOUND) {
				dur = new Integer(1);
				dur.addTag(new Tag('seconds'));
			}

			let sampPerCycle = convertTimeToSamples(dur);

			let data = [];
			for (let i = 0; i < sampPerCycle; i++) {
				let d = 1.0 - (i / sampPerCycle);
				data[i] = d;
			}
			let wt = new Wavetable();
			wt.initWith(data);
			return wt;
		},
		'returns a wavetable of a saw wave'
	);

	Builtin.createBuiltin(
		'resample',
		[ 'wt', 'freq'],
		function $stretch(env, executionEnvironment) {
			let wt = env.lb('wt');
			let freq = env.lb('freq');
			if (freq == UNBOUND) {
				freq = new Integer(1);
				freq.addTag(new Tag('seconds'));
			}
			if (!(freq.getTypeName() == '-wavetable-')) {
				let tag = (freq.hasTags() ? freq.getTag(0) : null);
				freq = getConstantSignalFromValue(freq.getTypedValue())
				if (tag) {
					freq.addTag(tag);
				}
			}


			let timebase = nexToTimebase(freq);
			let oldDuration = wt.getDuration();
			let freqDuration = freq.getDuration()

			let data = [];
			let oldPosition = 0;
			for (let i = 0 ; oldPosition < oldDuration; i = (i + 1) % freqDuration) {
				let v = wt.interpolatedValueAtSample(oldPosition);
				let shiftValue = freq.valueAtSample(i);
				// convert that to samples
				let samples = convertTimeToSamples(shiftValue, timebase);
				// that number is the total number of samples it would be
				// if you resampled this entire wave at that rate.
				// But we are doing one timestep at a time, so
				// divide by original sample length.
				samples = samples / oldDuration;
				oldPosition += samples;
				data.push(v);
			}

			let wtr = new Wavetable();
			wtr.initWith(data);
			return wtr;
		},
		'resamples the audio to a duration or frequency.'
	);	

	Builtin.createBuiltin(
		'normalize',
		[ 'wt' ],
		function $normalize(env, executionEnvironment) {
			let wt = env.lb('wt');
			let amp = wt.getAmp();
			// this really doesn't need to be a builtin
			// this is just the same as gain
			let gain = 1/amp;
			let d = [];
			for (let i = 0; i < wt.getDuration(); i++) {
				let val = wt.valueAtSample(i);
				d[i] = val * gain;
			}
			let r = new Wavetable();
			r.initWith(d);
			return r;

		},
		'applies a gain to a wavetable (or attenuates it)'
	);


	Builtin.createBuiltin(
		'gain',
		[ 'wtlst...'],
		function $gain(env, executionEnvironment) {
			let wtlst = env.lb('wtlst');

			// if the first arg to wtlst is a list instead of a wt, use it
			if (wtlst.numChildren() == 1 && wtlst.getChildAt(0).isNexContainer()) {
				wtlst = wtlst.getChildAt(0);
			}

			let waves = [];

			let maxdur = 0;
			for (let i = 0; i < wtlst.numChildren(); i++) {
				let c = wtlst.getChildAt(i);
				if (!(c.getTypeName() == '-wavetable-')) {
					c = getConstantSignalFromValue(c.getTypedValue())
				}
				let d = c.getDuration();
				if (d > maxdur) {
					maxdur = d;
				}
				waves.push(c);
			}
			// set the size of the new wavetable to be duration I guess?
			let d = [];
			for (let i = 0; i < maxdur; i++) {
				let v = 1;
				for (let j = 0; j < waves.length; j++) {
					v *= waves[j].valueAtSample(i);
				}
				d[i] = v;
			}
			let r = new Wavetable();
			r.initWith(d);
			return r;
		},
		'multiplies together all the passed in numbers or waves'
	);

	Builtin.createBuiltin(
		'clip',
		[ 'wt', 'dur1#%?', 'dur2#%?'],
		function $clip(env, executionEnvironment) {
			let dur1 = env.lb('dur1');
			let dur2 = env.lb('dur2');
			let wt = env.lb('wt');

			let zero = new Integer(0);

			if (dur1 == UNBOUND) {
				dur1 = dur2 = zero;
			} else {
				if (dur2 == UNBOUND) {
					dur2 = dur1;
					dur1 = zero;
				}
			}

			let numSamples1 = convertTimeToSamples(dur1);
			let numSamples2 = convertTimeToSamples(dur2);

			let d = [];
			let index = 0;
			let wtdur = wt.getDuration();

			// prepend phase
			for (let i = 0; i < numSamples1; i++) {
				d[index++] = 0;
			}
			for (let i = 0; i < numSamples2; i++) {
				if (i < wtdur) {
					d[index++] = wt.valueAtSample(i);
				} else {
					d[index++] = 0;
				}
			}
			let r = new Wavetable();
			r.initWith(d);
			return r;
		},
		'pads the beginning of the sample with silence (or trims if a negative value is passed in)'
	);

	Builtin.createBuiltin(
		'amplitude',
		[ 'wt'],
		function $amplitude(env, executionEnvironment) {
			let wt = env.lb('wt');
			let val = wt.getAmp();
			return new Float(val);
		},
		'gets the amplitude of a signal (max of absolute value, not RMS)'
	);

	Builtin.createBuiltin(
		'duration',
		[ 'wt'],
		function $duration(env, executionEnvironment) {
			let wt = env.lb('wt');
			let val = wt.getDuration();
			return new Integer(val);
		},
		'gets the duration of a signal in samples'
	);

	Builtin.createBuiltin(
		'silence',
		[ 'dur%#?'],
		function $duration(env, executionEnvironment) {
			let dur = env.lb('dur');
			if (dur == UNBOUND) {
				dur = new Integer(4);
				dur.addTag(new Tag('beats'));
			}
			dur = convertTimeToSamples(dur);
			return new Wavetable(dur);
		},
		'creates an empty wavetable (silence) with a duration of the requested number of samples'
	);

	Builtin.createBuiltin(
		'mix',
		[ 'wtlst...'],
		function $mix(env, executionEnvironment) {
			let wtlst = env.lb('wtlst');

			// if the first arg to wtlst is a list instead of a wt, use it
			if (wtlst.numChildren() == 1 && wtlst.getChildAt(0).isNexContainer()) {
				wtlst = wtlst.getChildAt(0);
			}

			let waves = [];

			let maxdur = 0;
			for (let i = 0; i < wtlst.numChildren(); i++) {
				let c = wtlst.getChildAt(i);
				if (!(c.getTypeName() == '-wavetable-')) {
					c = getConstantSignalFromValue(c.getTypedValue())
				}
				let d = c.getDuration();
				if (d > maxdur) {
					maxdur = d;
				}
				waves.push(c);
			}

			// set the size of the new wavetable to be duration I guess?
			let d = [];
			for (let i = 0; i < maxdur; i++) {
				let v = 0;
				for (let j = 0; j < waves.length; j++) {
					v += waves[j].valueAtSample(i);
				}
				d[i] = v;
			}
			let r = new Wavetable();
			r.initWith(d);
			return r;
		},
		'mixes together all the wavetables passed in'
	);

	Builtin.createBuiltin(
		'repeat',
		[ 'wt', 'dur%#?'],
		function $repeat(env, executionEnvironment) {
			let wt = env.lb('wt');
			let dur = env.lb('dur');
			if (dur == UNBOUND) {
				dur = new Integer(4);
				dur.addTag(new Tag('beats'));
			}
			dur = convertTimeToSamples(dur);

			let data = [];
			for (let i = 0; i < dur; i++) {
				data[i] = wt.valueAtSample(i);
			}
			let r = new Wavetable();
			r.initWith(data);
			return r;
		},
		'repeats a signal for |dur time.'
	);

	Builtin.createBuiltin(
		'seq',
		[ 'wtlst...'],
		function $chain(env, executionEnvironment) {
			let wtlst = env.lb('wtlst');

			// if the first arg to wtlst is a list instead of a wt, use it
			if (wtlst.numChildren() == 1 && wtlst.getChildAt(0).isNexContainer()) {
				wtlst = wtlst.getChildAt(0);
			}

			let rdata = [];
			for (let i = 0; i < wtlst.numChildren(); i++) {
				let c = wtlst.getChildAt(i);
				if (c.getTypeName() != '-wavetable-') {
					return new EError('repeat: contents of arg list must all be wavetables');					
				}
				for (let j = 0; j < c.getDuration(); j++) {
					rdata.push(c.valueAtSample(j));
				}
			}
			let wtr = new Wavetable();
			wtr.initWith(rdata);
			wtr.calculateAmplitude();
			return wtr;
		},
		'sequences several wavetables into a single one'
	);

	Builtin.createBuiltin(
		'audio',
		[ ],
		function $audio(env, executionEnvironment) {
			let r = new Org();

			for (let i = 0; i < AVAILABLE_AUDIO_FILES.length; i++) {
				let s = new EString(AVAILABLE_AUDIO_FILES[i]);
				r.appendChild(s);
			}

			return r;
		},
		'returns a list of all the available audio files.'
	);

	Builtin.createBuiltin(
		'load-sample',
		[ 'fname$' ],
		function $loadSample(env, executionEnvironment) {
			let fname = env.lb('fname').getFullTypedValue();

			let r = new Wavetable();
			r.loadFromFile(fname);
			return r;
		},
		'returns a list of all the available audio files.'
	);

	Builtin.createBuiltin(
		'set-bpm',
		[ 'bpm#%' ],
		function $setBpm(env, executionEnvironment) {
			let bpm = env.lb('bpm');
			let v = bpm.getTypedValue();
			setBpm(v);
			return new Nil();
		},
		'sets the global BPM used in time calculations.'
	);
}

export { createWavetableBuiltins }
