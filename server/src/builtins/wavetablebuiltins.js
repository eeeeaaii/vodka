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

import { Builtin } from '../nex/builtin.js'; 

import { constructFatalError, newTagOrThrowOOM } from '../nex/eerror.js'
import { constructWavetable } from '../nex/wavetable.js'; 
import { constructNil } from '../nex/nil.js'
import { constructInteger } from '../nex/integer.js'; 
import { constructOrg } from '../nex/org.js'; 
import { constructFloat } from '../nex/float.js'; 
import { constructEString } from '../nex/estring.js'; 
import { constructDeferredValue } from '../nex/deferredvalue.js'
import { constructEError } from '../nex/eerror.js'
import {
	GenericActivationFunctionGenerator
} from '../asyncfunctions.js'

import { UNBOUND } from '../environment.js'
import { loadSample, startRecordingAudio, stopRecordingAudio } from '../webaudio.js'
import {
	convertValueFromTag,
	convertTimeToSamples,
	setBpm,
	nexToTimebase,
	getReferenceFrequency,
	setDefaultTimebase,
	getDefaultTimebase,
	getSampleRate,
	getConstantSignalFromValue } from '../wavetablefunctions.js'
import { loopPlay, oneshotPlay, abortPlayback } from '../webaudio.js'
import { Tag } from '../tag.js'
import { ERROR_TYPE_INFO } from '../nex/eerror.js'
import { Command } from '../nex/command.js'; 
import { sAttach, sEval, makeCommandWithClosureOneArg, makeQuote } from '../syntheticroot.js'
import { heap } from '../heap.js'



function createWavetableBuiltins() {

	Builtin.createBuiltin(
		'set-default-timebase',
		[ 'a' ],
		function $setDefaultTimebase(env, executionEnvironment) {
			let a = env.lb('a');
			setDefaultTimebase(a);
			return constructNil();
		},
		'Looks at the tags on |a and sets the default timebase based on their values.'
	);

	Builtin.createBuiltin(
		'get-default-timebase',
		[ ],
		function $getDefaultTimebase(env, executionEnvironment) {
			let tb = getDefaultTimebase();
			return constructEString(tb);
		},
		'Returns the default timebase.'
	);

	Builtin.createBuiltin(
		'oneshot-play',
		[ 'wt', 'channels?' ],
		function $oneshotPlay(env, executionEnvironment) {
			let wt = env.lb('wt');
			let channels = env.lb('channels');

			let buffers = [];
			if (Utils.isNexContainer(wt)) {
				for (let i = 0; i < wt.numChildren(); i++) {
					buffers.push(wt.getChildAt(i).getCachedBuffer());
				}
			} else {
				buffers.push(wt.getCachedBuffer());
			}

			let channelnumbers = [0, 1];
			if (channels != UNBOUND) {
				channelnumbers = [];
				if (Utils.isNexContainer(channels)) {
					for (let i = 0; i < channels.numChildren(); i++) {
						channelnumbers.push(channels.getChildAt(i).getTypedValue());
					}
				} else {
					channelnumbers.push(channels.getTypedValue());
				}
			}

			oneshotPlay(buffers, channelnumbers);
			return wt;
		},
		'Plays |wt immediately on the given channel. If |channel is not provided, the sound is played on the first 2 channels. If |channel and/or |wt are lists, Vodka will do its best to match up sounds with channels.'
	);

	Builtin.createBuiltin(
		'loop-play',
		[ 'wt', 'channels?' ],
		function $loopPlay(env, executionEnvironment) {
			let wt = env.lb('wt');
			let channels = env.lb('channels');

			let buffers = [];
			if (Utils.isNexContainer(wt)) {
				for (let i = 0; i < wt.numChildren(); i++) {
					buffers.push(wt.getChildAt(i).getCachedBuffer());
				}
			} else {
				buffers.push(wt.getCachedBuffer());
			}

			let channelnumbers = [0, 1];
			if (channels != UNBOUND) {
				channelnumbers = [];
				if (Utils.isNexContainer(channels)) {
					for (let i = 0; i < channels.numChildren(); i++) {
						channelnumbers.push(channels.getChildAt(i).getTypedValue());
					}
				} else {
					channelnumbers.push(channels.getTypedValue());
				}
			}

			loopPlay(buffers, channelnumbers);
			return wt;
		},
		'Starts playing wt| at the next measure start on |channel.  If |channel is not provided, the sound is played on the first 2 channels. If |channel and/or |wt are lists, Vodka will do its best to match up sounds with channels.'
	);


	Builtin.createBuiltin(
		'start-recording',
		[ '_wt' ],
		function $startRecording(env, executionEnvironment) {
			let wt = env.lb('wt');
			startRecordingAudio(wt);
			return wt;
		},
		'Tells |wt to start recording.'
	);

	Builtin.createBuiltin(
		'stopRecording',
		[ '_wt' ],
		function $startRecording(env, executionEnvironment) {
			let wt = env.lb('wt');
			stopRecordingAudio(wt);
			return wt;
		},
		'Tells |wt to stop recording.'
	);


	Builtin.createBuiltin(
		'abort-playback',
		[ 'channel#?' ],
		function $abortPlayback(env, executionEnvironment) {
			let channel = env.lb('channel');
			let channelnumber = -1;
			if (channel != UNBOUND) {
				channelnumber = channel.getTypedValue();
			}

			abortPlayback(channelnumber);
			return constructNil();
		},
		'Starts playing the sound at the next measure start'
	);


	Builtin.createBuiltin(
		'split',
		[ 'wt' ],
		function $play(env, executionEnvironment) {
			let wt = env.lb('wt');
			let r = constructOrg();
			for (let i = 0 ; i < wt.numSections(); i++) {
				let sd = wt.getSectionData(i);
				let w = constructWavetable(sd.data.length);
				let wdata = w.getData();
				for (let i = 0; i < sd.data.length; i++) {
					wdata[i] = sd.data[i];
				}
				w.init();
				r.appendChild(w);		
			}
			return r;
		},
		'Splits a wavetable into smaller sections based on markers added in wavetable editor'
	);


	Builtin.createBuiltin(
		'wavefold',
		[ 'wt'],
		function $reverse(env, executionEnvironment) {
			let wt = env.lb('wt');

			let dur = wt.getDuration();
			let r = constructWavetable(dur);
			let data = r.getData();

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
			r.init();
			return r;
		},
		'Reverses wavetable |wt'
	);	

	Builtin.createBuiltin(
		'reverse',
		[ 'wt'],
		function $reverse(env, executionEnvironment) {
			let wt = env.lb('wt');

			let dur = wt.getDuration();
			let r = constructWavetable(dur);
			let data = r.getData();
			for (let i = 0; i < dur; i++) {
				data[i] = wt.valueAtSample(dur - i);
			}
			r.init();
			return r;
		},
		'Reverses wavetable |wt'
	);

	Builtin.createBuiltin(
		'constant',
		[ 'val#%?', 'len#%?' ],
		function $const(env, executionEnvironment) {
			let len = env.lb('len');
			let val = env.lb('val');

			let dur = 256;
			if (len != UNBOUND) {
				dur = convertTimeToSamples(len);
			}
			let valfloat = 1.0;
			if (val != UNBOUND) {
				valfloat = convertValueFromTag(val);
			}

			return getConstantSignalFromValue(valfloat, dur);
		},
		'Returns |dur samples of a constant value |val'
	);

	Builtin.createBuiltin(
		'singlepole',
		[ 'wt1', 'wt2' ],
		function $singlepole(env, executionEnvironment) {
			let wt1 = env.lb('wt1');
			let wt2 = env.lb('wt2');

			if (!(wt2.getTypeName() == '-wavetable-')) {
				wt2 = getConstantSignalFromValue(wt2.getTypedValue(), wt1.getDuration())
				sAttach(wt2);
			}

			let dur = Math.max(wt1.getDuration(), wt2.getDuration());
			let r = constructWavetable(dur);
			let data = r.getData();
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
			r.init();
			return r;
		},
		'Runs |wt1 through a single pole filter with a cutoff determined by |wt2. If an integer or float is passed in for wt2, it is converted to a constant signal. A value of 1 corresponds to a filter cutoff frequency of 20kHz.'
	);	

	Builtin.createBuiltin(
		'convolve',
		[ 'wt', 'ir' ],
		function $convolve(env, executionEnvironment) {
			let wt = env.lb('wt');
			let ir = env.lb('ir');

			let wtLen = wt.getDuration();
			let irLen = ir.getDuration();
			let outLen = wtLen + irLen;
			let r = constructWavetable(outLen); // -1
			let rdata = r.getData();
			for (let outIndex = 0; outIndex < outLen; outIndex++) {
				let sum = 0;
				for (let offset = 0; offset < irLen; offset++) {
					let irIndex = offset;
					let wtIndex = outIndex - offset;
					if (irIndex < irLen && wtIndex >= 0) {
						let irValue = ir.valueAtSample(irIndex);
						// Note: wt will loop to the beginning of the sample if we ask for an index beyond the end of it.
						// However for a realistic reverb what we really want is zeros once we get to the end of the sound.
						// We will be indexing past the end of the sound when outIndex gets greater than wtLen and
						// offset is 0 or a small value.
						let wtValue = (wtIndex >= wtLen ? 0.0 : wt.valueAtSample(wtIndex));
						sum += irValue * wtValue;
					}
				}
				rdata[outIndex] = sum;
			}
			r.init();
			return r;
		},
		'Convolves |wt with |ir. If |ir is an impulse response, this should give a reverb effect. Otherwise this will create a hybrid sound that shares some characteristics of both sounds. Warning: this function is very slow, you may have to wait a while.'
	);	


	Builtin.createBuiltin(
		'slew',
		[ 'wt1', 'wt2' ],
		function $slew(env, executionEnvironment) {
			let wt1 = env.lb('wt1');
			let wt2 = env.lb('wt2');

			if (!(wt2.getTypeName() == '-wavetable-')) {
				wt2 = getConstantSignalFromValue(wt2.getTypedValue(), wt1.getDuration())
				sAttach(wt2);
			}

			let dur = Math.max(wt1.getDuration(), wt2.getDuration());
			let r = constructWavetable(dur);
			let data = r.getData();

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
			r.init();
			return r;
		},
		'Slows down rate of change of |wt1 to a maximum value per sample given by |wt2. If wt1 is a signal residing between -1 and 1, values of wt2 that are between 0 and 1 will yield best results.'
	);	

// fix this, example situation where it breaks:
// take a normal ramp (2 beats) and pass it through a function that takes the value to the 5th power
// the function will return, but some async bullshit will continue and some numbers will keep incrementing in the js console, not sure what is happening

/*
	Builtin.createBuiltin(
		'wavecalc',
		[ 'wt', 'f&' ],
		function $const(env, executionEnvironment) {
			let wt = env.lb('wt');
			let f = env.lb('f');

			let dur = wt.getDuration();
			let r = constructWavetable(dur);
			let data = r.getData();
			for (let i = 0 ; i < dur; i++) {
				let v = constructFloat(wt.valueAtSample(i));
				let result = sEval(makeCommandWithClosureOneArg(f, makeQuote(v)),
								   executionEnvironment,
								   'wavecalc: error returned from function');
				if (result.getTypeName() != '-float-') {
					return constructFatalError('wavecalc: function must return a float');
				}
				data[i] = result.getTypedValue();
			}
			r.init();
			return r;
		},
		'Calls function |f on every sample in |wt (this may take a while for long samples)'
	);	
*/

	Builtin.createBuiltin(
		'noise',
		[ 'len#%?' ],
		function $noise(env, executionEnvironment) {
			let len = env.lb('len');
			if (len == UNBOUND) {
				len = constructInteger(getReferenceFrequency());
				len.addTag(newTagOrThrowOOM('hz', 'noise wavetable builtin, timebase'));
				sAttach(len);
			}
			let dur = convertTimeToSamples(len);
			let r = constructWavetable(dur);
			let data = r.getData();

			for (let i = 0; i < dur; i++) {
				let n = Math.random() * 2.0 - 1.0;
				data[i] = n;
			}
			r.init();
			return r;
		},
		'Returns dur samples (or seconds, etc) of white noise'
	);

	Builtin.createBuiltin(
		'sinewave',
		[ 'nn#%?' ],
		function $sinewave(env, executionEnvironment) {
			let nn = env.lb('nn');
			if (nn == UNBOUND) {
				nn = constructInteger(getReferenceFrequency());
				nn.addTag(newTagOrThrowOOM('hz', 'sinewave wavetable builtin, timebase'))
				sAttach(nn);
			}

			let dur = convertTimeToSamples(nn);
			let r = constructWavetable(dur);
			let data = r.getData();
			for (let i = 0; i < dur; i++) {
				let d = Math.sin((i / dur) * 2 * Math.PI);
				data[i] = d;
			}
			r.init();
			return r;
		},
		'Returns a wavetable of a sine wave'
	);

	Builtin.createBuiltin(
		'gate',
		[ 'nn#%?' ],
		function $squarewave(env, executionEnvironment) {
			let nn = env.lb('nn');
			if (nn == UNBOUND) {
				nn = constructInteger(1);
				nn.addTag(newTagOrThrowOOM('b', 'gate wavetable builtin, timebase'));
				sAttach(nn);
			}

			let dur = convertTimeToSamples(nn);
			let r = constructWavetable(dur);
			let data = r.getData();

			for (let i = 0; i < dur; i++) {
				if (i < (dur/2)) {
					data[i] = 0;
				} else {
					data[i] = 1;
				}
			}
			r.init();
			return r;
		},
		'Returns a wavetable of a gate signal'
	);	

	Builtin.createBuiltin(
		'squarewave',
		[ 'nn#%?' ],
		function $squarewave(env, executionEnvironment) {
			let nn = env.lb('nn');
			if (nn == UNBOUND) {
				nn = constructInteger(getReferenceFrequency());
				nn.addTag(newTagOrThrowOOM('hz', 'squarewave wavetable builtin, timebase'));
				sAttach(nn);
			}

			let dur = convertTimeToSamples(nn);
			let r = constructWavetable(dur);
			let data = r.getData();

			let numHarmonics = 16;
			let freq = (1 / dur) * getSampleRate();
			for (let i = 0; i < dur; i++) {
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
			r.init();
			return r;
		},
		'Returns a wavetable of a square wave'
	);

	Builtin.createBuiltin(
		'sawwave',
		[ 'nn#%?' ],
		function $sawwave(env, executionEnvironment) {
			let nn = env.lb('nn');
			if (nn == UNBOUND) {
				nn = constructInteger(getReferenceFrequency());
				nn.addTag(newTagOrThrowOOM('hz', 'sawwave wavetable builtin, timebase'));
				sAttach(nn);
			}

			let dur = convertTimeToSamples(nn);
			let r = constructWavetable(dur);
			let data = r.getData();

			for (let i = 0; i < dur; i++) {
				let d = (i / dur);
				data[i] = d;
			}
			r.init();
			return r;
		},
		'Returns a wavetable of a saw wave'
	);

	Builtin.createBuiltin(
		'ramp',
		[ 'len#%?' ],
		function $ramp(env, executionEnvironment) {
			let len = env.lb('len');
			if (len == UNBOUND) {
				len = constructInteger(1);
				len.addTag(newTagOrThrowOOM('seconds', 'ramp wavetable builtin, timebase'));
				sAttach(len);
			}

			let dur = convertTimeToSamples(len);
			let r = constructWavetable(dur);
			let data = r.getData();

			for (let i = 0; i < dur; i++) {
				let d = 1.0 - (i / dur);
				data[i] = d;
			}
			r.init();
			return r;
		},
		'Returns a sample that ramps from one to zero in |len.'
	);

	Builtin.createBuiltin(
		'resample-to',
		[ 'wt', 'freq?'],
		function $resampleTo(env, executionEnvironment) {
			let wt = env.lb('wt');
			let freq = env.lb('freq');
			if (freq == UNBOUND) {
				freq = constructInteger(1);
				freq.addTag(newTagOrThrowOOM('seconds', 'resample wavetable builtin, timebase'));
				sAttach(freq);
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


			// IDK if there's a smarter way to do this than doing two loops,
			// but I want to calculate the size of the destination first.

			// for reasons I don't understand the below loop crashes chrome if it
			// goes on too long. I don't know why it's getting an OOM condition.
			// Experimentally on my machine I can get to about 120,000,000
			// but I'll restrict the user to 10,000,000

			let maxdur = 10000000;
			let dur = 0;
			let oldPosition = 0;
			for (let i = 0 ; oldPosition < oldDuration; i = (i + 1) % freqDuration) {
				let shiftValue = freq.valueAtSample(i);
				// at every time step we have a different idea of what the new duration
				// will be, this is the current value
				let instantaneousNewDuration = convertTimeToSamples(shiftValue, timebase);
				if (dur > maxdur) {
					return constructFatalError(`resample: result wavetable too long! Must be less than ${maxdur} samples.`)
				}
				// for example, if the old duration is 1 second, and the new duration is 0.5 seconds,
				// then as we are building the new waveform sample by sample, we effectively skip
				// every other sample. The amount of time we need to advance in each step is given by
				// the old duration divided by the new duration (in this example, 1 / 0.5 = 2.0 samples)
				// Of course, we recalculate every step because the resample amount can be a waveform.
				let amountToAdvance = oldDuration / instantaneousNewDuration;
				oldPosition += amountToAdvance;
				dur++;
			}
			if (dur == 0) {
				return constructFatalError(`resample: result wavetable too short (would be zero-length).`)				
			}
			let r = constructWavetable(dur);
			let data = r.getData();

			let j = 0;
			oldPosition = 0;
			for (let i = 0 ; oldPosition < oldDuration; j++, i = (i + 1) % freqDuration) {
				let v = wt.interpolatedValueAtSample(oldPosition);
				let shiftValue = freq.valueAtSample(i);
				// convert that to samples
				let instantaneousNewDuration = convertTimeToSamples(shiftValue, timebase);
				// that number is the total number of samples it would be
				// if you resampled this entire wave at that rate.
				// But we are doing one timestep at a time, so
				// divide by original sample length.
				let amountToAdvance = oldDuration / instantaneousNewDuration;
				oldPosition += amountToAdvance;
				data[j] = v;
			}

			r.init();
			return r;
		},
		'Resamples the audio to a given duration or frequency (for example, changing a sample from 2 seconds to 4 seconds).'
	);	

	Builtin.createBuiltin(
		'resample-by',
		[ 'wt', 'amount'],
		function $resampleBy(env, executionEnvironment) {
			let wt = env.lb('wt');
			let amt = env.lb('amount');
			if (amt == UNBOUND) {
				amt = constructInteger(1);
				sAttach(amt);
			}

			let resultDuration = 0;

			let oldDuration = wt.getDuration();

			if (!(amt.getTypeName() == '-wavetable-')) {
				let scaleFactor = amt.getTypedValue();
				if (scaleFactor == 0) {
					return constructFatalError('resample-by: cannot scale to a constant value that is zero.')
				}
				amt = getConstantSignalFromValue(scaleFactor);
				resultDuration = oldDuration * (1 / (Math.abs(scaleFactor)));
			} else {
				// match the duration of the second arg.
				resultDuration = amt.getDuration();
			}
			let amtDuration = amt.getDuration();
			let maxdur = 1000000;
			if (resultDuration > maxdur) {
				return constructFatalError(`resample: result wavetable too long! Must be less than ${maxdur} samples.`)
			}
			if (resultDuration <= 0) {
				// is it possible to get here?
				return constructFatalError(`resample: result wavetable too short (would be zero-length).`)				
			}

			let r = constructWavetable(resultDuration);
			let data = r.getData();

			let oldPosition = 0;
			for (let i = 0 ; i < resultDuration; i++) {
				let v = wt.interpolatedValueAtSample(oldPosition);
				let amountToAdvance = amt.valueAtSample(i % amtDuration);
				oldPosition += amountToAdvance;
				data[i] = v;
			}

			r.init();
			return r;
		},
		'Resamples the audio by a percentage given by the second arg. Positive 1 means no change. Negative values cause the "play head" to reverse direction. If the second argument is a constant, the duration of the result is determined by the first argument, otherwise the duration of the second argument determines the result duration.'
	);	

	Builtin.createBuiltin(
		'normalize',
		[ 'wt' ],
		function $normalize(env, executionEnvironment) {
			let wt = env.lb('wt');
			let amp = wt.getAmp();
			let gain = 1/amp;

			let dur = wt.getDuration();
			let r = constructWavetable(dur);
			let data = r.getData();
			for (let i = 0; i < wt.getDuration(); i++) {
				let val = wt.valueAtSample(i);
				data[i] = val * gain;
			}
			r.init();
			return r;

		},
		'Normalizes a wavetable (attenuates it such that the highest peak is exactly at full scale, or 1)'
	);

	Builtin.createBuiltin(
		'half-rectify',
		[ 'wt' ],
		function $halfrectify(env, executionEnvironment) {
			let wt = env.lb('wt');

			let dur = wt.getDuration();
			let r = constructWavetable(dur);
			let data = r.getData();
			for (let i = 0; i < wt.getDuration(); i++) {
				let val = wt.valueAtSample(i);
				if (val >= 0) {
					data[i] = val;
				} else {
					data[i] = 0;
				}
			}
			r.init();
			return r;

		},
		'Changes all negative signal values in |wt to zero, but leaves positive values alone.'
	);

	Builtin.createBuiltin(
		'full-rectify',
		[ 'wt' ],
		function $fullrectify(env, executionEnvironment) {
			let wt = env.lb('wt');

			let dur = wt.getDuration();
			let r = constructWavetable(dur);
			let data = r.getData();
			for (let i = 0; i < wt.getDuration(); i++) {
				let val = wt.valueAtSample(i);
				if (val >= 0) {
					data[i] = val;
				} else {
					data[i] = -val;
				}
			}
			r.init();
			return r;

		},
		'Inverts just the negative signal values in |wt, leaving positive values alone.'
	);

	Builtin.createBuiltin(
		'invert',
		[ 'wt' ],
		function $invert(env, executionEnvironment) {
			let wt = env.lb('wt');

			let dur = wt.getDuration();
			let r = constructWavetable(dur);
			let data = r.getData();
			for (let i = 0; i < wt.getDuration(); i++) {
				let val = wt.valueAtSample(i);
				data[i] = -val;
			}
			r.init();
			return r;

		},
		'Inverts the sign of all values in |wt, making positive negative and negative positive.'
	);

	Builtin.createBuiltin(
		'offset',
		[ 'wt', 'amt'],
		function $offset(env, executionEnvironment) {
			let wt = env.lb('wt');
			let amt = env.lb('amt');


			if (!(amt.getTypeName() == '-wavetable-')) {
				amt = getConstantSignalFromValue(amt.getTypedValue(), wt.getDuration())
				sAttach(amt);
			}

			let dur = Math.max(wt.getDuration(), amt.getDuration());
			let r = constructWavetable(dur);
			let data = r.getData();

			for (let i = 1 ; i < dur; i++) {
				let val = wt.valueAtSample(i);
				let offset = amt.valueAtSample(i);
				data[i] = val + offset;
			}
			r.init();
			return r;
		},
		'Offsets the signal value of |wt by |amt (note that |amt can be another wavetable).'
	);

	Builtin.createBuiltin(
		'phase-shift',
		[ 'wt', 'amt'],
		function $offset(env, executionEnvironment) {
			let wt = env.lb('wt');
			let amt = env.lb('amt');

			if (!(amt.getTypeName() == '-wavetable-')) {
				amt = getConstantSignalFromValue(amt.getTypedValue(), wt.getDuration())
				sAttach(amt);
			}

			let originalDur = wt.getDuration();
			let dur = Math.max(originalDur, amt.getDuration());
			let r = constructWavetable(dur);
			let data = r.getData();

			for (let i = 1 ; i < dur; i++) {
				let shift = amt.valueAtSample(i);
				let samplesToShift = shift * originalDur;
				let val = wt.interpolatedValueAtSample(i + samplesToShift);
				data[i] = val;
			}
			r.init();
			return r;
		},
		'phase shifts the signal by |amt. The length of |wt is considered to be one "cycle" (even if it is a complex waveform). The values for |amt should range from 1.0 (full cycle shift forward) to -1.0 (full cycle shift backward). A wavetable can be passed in for |amt.'
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

			let dur = 0;
			for (let i = 0; i < wtlst.numChildren(); i++) {
				let c = wtlst.getChildAt(i);
				if (!(c.getTypeName() == '-wavetable-')) {
					c = getConstantSignalFromValue(c.getTypedValue())
				}
				let d = c.getDuration();
				if (d > dur) {
					dur = d;
				}
				waves.push(c);
			}
			let r = constructWavetable(dur);
			let data = r.getData();

			for (let i = 0; i < dur; i++) {
				let v = 1;
				for (let j = 0; j < waves.length; j++) {
					v *= waves[j].valueAtSample(i);
				}
				data[i] = v;
			}
			r.init();
			return r;
		},
		'Multiplies together all the passed in numbers or waves'
	);

	Builtin.createBuiltin(
		'clipad',
		[ 'wt', 'len#%'],
		function $sizeto(env, executionEnvironment) {
			let len = env.lb('len');
			let wt = env.lb('wt');

			let dur = convertTimeToSamples(len);
			let r = constructWavetable(dur);
			let data = r.getData();

			let index = 0;
			let wtdur = wt.getDuration();

			for (let i = 0; i < dur; i++) {
				if (i < wtdur) {
					data[index++] = wt.valueAtSample(i);
				} else {
					data[index++] = 0;
				}
			}
			r.init();
			return r;
		},
		'Clips the length of the wavetable, or pads the end of it with silence, depending on whether the passed-in length is greater or less than the length of the wavetable.'
	);

	Builtin.createBuiltin(
		'remove-from-start',
		[ 'wt', 'len#%'],
		function $removeStart(env, executionEnvironment) {
			let len = env.lb('len');
			let wt = env.lb('wt');

			let amountToRemove = convertTimeToSamples(len);
			let originalDuration = wt.getDuration();
			if (amountToRemove > originalDuration) {
				amountToRemove = originalDuration;
			}
			if (amountToRemove < 0) {
				amountToRemove = 0;
			}
			let startPosition = amountToRemove;
			let resultDur = originalDuration - amountToRemove;


			let r = constructWavetable(resultDur);
			let data = r.getData();

			for (let i = startPosition; i < originalDuration; i++) {
				data[i - startPosition] = wt.valueAtSample(i);
			}
			r.init();
			return r;
		},
		'Removes |len amount of sound from the start of |wt.'
	);

	Builtin.createBuiltin(
		'remove-from-end',
		[ 'wt', 'len#%'],
		function $removeEnd(env, executionEnvironment) {
			let len = env.lb('len');
			let wt = env.lb('wt');

			let amountToRemove = convertTimeToSamples(len);
			let originalDuration = wt.getDuration();
			if (amountToRemove > originalDuration) {
				amountToRemove = originalDuration;
			}
			if (amountToRemove < 0) {
				amountToRemove = 0;
			}

			let placeToStop = originalDuration - amountToRemove;
			let resultDur = placeToStop;



			let r = constructWavetable(resultDur);
			let data = r.getData();

			for (let i = 0; i < placeToStop; i++) {
				data[i] = wt.valueAtSample(i);
			}
			r.init();
			return r;
		},
		'Removes |len amount of sound from the end of |wt.'
	);

	Builtin.createBuiltin(
		'delay',
		[ 'wt', 'time#%'],
		function $delay(env, executionEnvironment) {
			let time = env.lb('time');
			let wt = env.lb('wt');

			time = convertTimeToSamples(time);
			let originalDuration = wt.getDuration();
			let outputDuration = originalDuration + time;

			let r = constructWavetable(outputDuration);
			let data = r.getData();

			for (let i = time; i < outputDuration; i++) {
				data[i] = wt.valueAtSample(i - time);
			}
			r.init();
			return r;
		},
		'Outputs a delayed copy of |wt (the beginning is padded with silence). Combine with the feedback builtin to get a classic delay sound.'
	);

	Builtin.createBuiltin(
		'feedback',
		[ 'wt', 'f&', 'attenuation%', 'n#'],
		function $delay(env, executionEnvironment) {
			let wt = env.lb('wt');
			let f = env.lb('f');
			let attenuation = env.lb('attenuation').getTypedValue();
			let n = env.lb('n').getTypedValue();

			let dur = wt.getDuration();
			let wtData = wt.getData();
			let output = constructWavetable(dur);
			let outData = output.getData();

			for (let i = 0; i < dur; i++) {
				outData[i] = wtData[i];
			}

			let fedBackSignal = wt;
			for (let i = 0; i < n; i++) {
				fedBackSignal = sEval(makeCommandWithClosureOneArg(f, fedBackSignal));
				let fedBackData = fedBackSignal.getData();
				for (let j = 0; j < fedBackSignal.getDuration(); j++) {
					fedBackData[j] = fedBackData[j] * attenuation;
				}
				for (let j = 0; j < dur; j++) {
					if (j < fedBackSignal.getDuration()) {
						outData[j] += fedBackData[j]
					}
				}
			}

			output.init();
			return output;
		},
		'Calls the function |f on |wt to produce an output, then calls |f on that output, then calls |f on the output of that, and so on, |n times, attenuating the output by |attenuation each time before passing it back into |f. The output of this function is the sum of all the outputs. This mimics analog feedback, but note that the |n parameter is a hard limit on the number of times the function is fed back into itself.'
	);



	Builtin.createBuiltin(
		'amplitude',
		[ 'wt'],
		function $amplitude(env, executionEnvironment) {
			let wt = env.lb('wt');
			let val = wt.getAmp();
			return constructFloat(val);
		},
		'Gets the amplitude of a signal (max of absolute value, not RMS)'
	);

	Builtin.createBuiltin(
		'duration',
		[ 'wt'],
		function $duration(env, executionEnvironment) {
			let wt = env.lb('wt');
			let val = wt.getDuration();
			return constructInteger(val);
		},
		'Gets the duration of a signal in samples'
	);

	Builtin.createBuiltin(
		'silence',
		[ 'len%#?'],
		function $lenation(env, executionEnvironment) {
			let len = env.lb('len');
			if (len == UNBOUND) {
				len = constructInteger(4);
				len.addTag(newTagOrThrowOOM('beats', 'silence wavetable builtin, timebase'));
				sAttach(len);
			}
			let dur = convertTimeToSamples(len);
			return constructWavetable(dur);
		},
		'Creates an empty wavetable (silence) with a duration of the requested number of samples'
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

			let dur = 0;
			for (let i = 0; i < wtlst.numChildren(); i++) {
				let c = wtlst.getChildAt(i);
				if (!(c.getTypeName() == '-wavetable-')) {
					c = getConstantSignalFromValue(c.getTypedValue())
				}
				let d = c.getDuration();
				if (d > dur) {
					dur = d;
				}
				waves.push(c);
			}

			let r = constructWavetable(dur);
			let data = r.getData();
			for (let i = 0; i < dur; i++) {
				let v = 0;
				for (let j = 0; j < waves.length; j++) {
					v += waves[j].valueAtSample(i);
				}
				data[i] = v;
			}
			r.init();
			return r;
		},
		'Mixes together all the wavetables passed in'
	);

	Builtin.createBuiltin(
		'loop-for',
		[ 'wt', 'len%#?'],
		function $loopFor(env, executionEnvironment) {
			let wt = env.lb('wt');
			let len = env.lb('len');
			if (len == UNBOUND) {
				len = constructInteger(4);
				len.addTag(newTagOrThrowOOM('beats', 'loop-for wavetable builtin, timebase'));
				sAttach(len);
			}
			let dur = convertTimeToSamples(len);
			let r = constructWavetable(dur);
			let data = r.getData();

			for (let i = 0; i < dur; i++) {
				data[i] = wt.valueAtSample(i);
			}
			r.init();
			return r;
		},
		'Loops a sample for |len time.'
	);

	Builtin.createBuiltin(
		'repeat',
		[ 'wt', 'reps#?'],
		function $repeat(env, executionEnvironment) {
			let wt = env.lb('wt');
			let times = 1;
			if (times != UNBOUND) {
				times = env.lb('reps').getTypedValue();
			}
			let wtdur = wt.getDuration();
			let dur = wtdur * times;
			let r = constructWavetable(dur);
			let data = r.getData();

			for (let i = 0; i < dur; i++) {
				data[i] = wt.valueAtSample(i % wtdur);
			}
			r.init();
			return r;
		},
		'Repeats (loops) a sample a number of times exactly equal to |reps.'
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

			let dur = 0;
			for (let i = 0; i < wtlst.numChildren(); i++) {
				let c = wtlst.getChildAt(i);
				if (c.getTypeName() != '-wavetable-') {
					return constructFatalError('seq: contents of arg list must all be wavetables');					
				}
				dur += c.getDuration();
			}

			let r = constructWavetable(dur);
			let data = r.getData();

			let k = 0;
			for (let i = 0; i < wtlst.numChildren(); i++) {
				let c = wtlst.getChildAt(i);
				for (let j = 0; j < c.getDuration(); j++, k++) {
					data[k] = c.valueAtSample(j);
				}
			}
			r.init();
			return r;
		},
		'Sequences a list of wavetables into a single wavetable by concatenating them.'
	);

	Builtin.createBuiltin(
		'audio',
		[ ],
		function $audio(env, executionEnvironment) {
			let r = constructOrg();

			for (let i = 0; i < AVAILABLE_AUDIO_FILES.length; i++) {
				let s = constructEString(AVAILABLE_AUDIO_FILES[i]);
				r.appendChild(s);
			}

			return r;
		},
		'Returns a list of all the available audio files.'
	);

	Builtin.createBuiltin(
		'load-sample',
		[ 'fname$' ],
		function $loadSample(env, executionEnvironment) {
			let fname = env.lb('fname').getFullTypedValue();


			let deferredValue = constructDeferredValue();
			deferredValue.set(new GenericActivationFunctionGenerator(
				'load-sample', 
				function(callback, deferredValue) {
					loadSample(fname, function(sampledata) {
						let r = constructWavetable(sampledata.length);
						r.initWith(sampledata);
						callback(r);
					})
				}
			));
			let loadingMessage = constructEError(`loading sample`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			deferredValue.appendChild(loadingMessage)
			deferredValue.activate();
			return deferredValue;



			// let r = constructWavetable();
			// r.loadFromFile(fname);
			// return r;
		},
		'Loads a sample file from disk.'
	);

	Builtin.createBuiltin(
		'set-bpm',
		[ 'bpm#%' ],
		function $setBpm(env, executionEnvironment) {
			let bpm = env.lb('bpm');
			let v = bpm.getTypedValue();
			setBpm(v);
			return constructNil();
		},
		'Sets the global BPM used in time calculations.'
	);
}

export { createWavetableBuiltins }
