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
import * as Utils from "../utils.js";

import { Builtin } from "../nex/builtin.js";

import { constructFatalError, newTagOrThrowOOM } from "../nex/eerror.js";
import { constructWavetable } from "../nex/wavetable.js";
import { constructNil } from "../nex/nil.js";
import { constructInteger } from "../nex/integer.js";
import { constructOrg } from "../nex/org.js";
import { constructFloat } from "../nex/float.js";
import { constructBool } from "../nex/bool.js";
import { constructEString } from "../nex/estring.js";
import { constructDeferredValue } from "../nex/deferredvalue.js";
import { constructEError } from "../nex/eerror.js";
import { GenericActivationFunctionGenerator } from "../asyncfunctions.js";

import { UNBOUND } from "../environment.js";
import { readAudioTags, splitLibraryFromPath, normalizeAudioName,
    withWavExtension, DEFAULT_LIBRARY } from "../audiolibraries.js";

import {
  loadAudio,
  startRecordingAudio,
  stopRecordingAudio,
} from "../webaudio.js";
import {
  convertValueFromTag,
  convertTimeToSamples,
  setBpm,
  getBpm,
  nexToTimebase,
  timebaseFromTags,
  timebaseForTagString,
  convertSamplesToTimebase,
  getReferenceFrequency,
  setDefaultTimebase,
  getDefaultTimebase,
  getSampleRate,
  getConstantSignalFromValue,
  frequencyToNoteNum,
  hasCommandTag,
} from "../wavetablefunctions.js";
import { fft, nextPowerOfTwo, forEachSpectrum, hannWindow } from "../fft.js";
import { detectPitchHz } from "../pitch.js";
import {
  applyFormants,
  vowelNames,
  cutIntoGrains,
  foldInto,
  cutoffToHz,
  resonanceToQ,
  biquadInto,
  bestMatchOffset,
  stretchInto,
  decayTailSamples,
} from "../wavetablefunctions.js";
import { loopPlay, queueBreak, atNextCycleStart, abortPlayback, endLoops, clipStartedPlaying, togglePauseLoops, loopsArePlaying, getAudioChannelCount } from "../webaudio.js";
import { constructClip } from "../nex/clip.js";
import { Tag } from "../tag.js";
import { ERROR_TYPE_INFO } from "../nex/eerror.js";
import { Command } from "../nex/command.js";
import { sAttach, sEval } from "../syntheticroot.js";
import { heap } from "../heap.js";
import { systemState } from "../systemstate.js";

function createWavetableBuiltins() {
  Builtin.createBuiltin(
    "set-default-timebase",
    ["a"],
    function $setDefaultTimebase(env, executionEnvironment) {
      let a = env.lb("a");
      setDefaultTimebase(a);
      return constructNil();
    },
    "Sets the default timebase from the tags on |a."
  );

  Builtin.createBuiltin(
    "get-default-timebase",
    [],
    function $getDefaultTimebase(env, executionEnvironment) {
      let tb = getDefaultTimebase();
      return constructEString(tb);
    },
    "The default timebase."
  );

  Builtin.createBuiltin(
    "toggle-playback",
    ["clipμ"],
    function $togglePlayback(env, executionEnvironment) {
      let clip = env.lb("clip");
      if (Utils.isNil(clip)) return goneClipError("toggle-playback");
      if (!Utils.isClip(clip)) {
        return constructFatalError("toggle-playback: not a clip. Sorry!");
      }
      if (!togglePauseLoops(clip.getIds())) {
        return constructFatalError("toggle-playback: that clip already stopped. Sorry!");
      }
      return clip;
    },
    /*
    Silencing a clip is not the end of it: the loop keeps its place in the
    cycle and its length, so starting it again puts it back in phase rather
    than starting a bar of its own. Delete the clip if you meant to be rid of
    it, which lets it finish the pass it is in.
    */
    "Silences |clip, or starts it again. A silenced clip keeps its place in the cycle and returns in time."
  );

  Builtin.createBuiltin(
    "is-playing",
    ["clipμ"],
    function $isPlaying(env, executionEnvironment) {
      let clip = env.lb("clip");
      if (Utils.isNil(clip)) return goneClipError("is-playing");
      if (!Utils.isClip(clip)) {
        return constructFatalError("is-playing: not a clip. Sorry!");
      }
      return constructBool(loopsArePlaying(clip.getIds()));
    },
    "True if |clip is making sound: still in the cycle, and not silenced."
  );

  /*
  A clip is never written to a file, so an expression that held one holds a nil
  after a refresh. Saying so beats complaining about whatever a nil looks like
  to the argument that was expecting a clip.

  (comment by Claude)
  */
  function goneClipError(who) {
    return constructFatalError(
        who + ": that clip is gone, a refresh does not keep them. Sorry!");
  }

  // Channels are 1-based to the user, the way audio hardware numbers them.
  // (comment by Claude)
  function toChannelIndexes(numbers, who) {
    let r = [];
    for (let i = 0; i < numbers.length; i++) {
      if (!(numbers[i] >= 1)) {
        return { error: constructFatalError(
            who + ": there is no channel " + numbers[i] + ". Sorry!") };
      }
      r.push(numbers[i] - 1);
    }
    return { indexes: r };
  }

  /*
  What play does, so that play-with-bpm can be play with one more thing rather
  than a second copy of it that drifts.

  (comment by Claude)
  */
  function startPlaying(wt, arg, name) {
    let buffers = [];
    /*
    Whether anything being played goes past full scale, asked of the waves
    rather than worked out here: each one already knows the largest sample it
    holds, from caching its buffer. So this is a comparison per wave, not a
    pass over the audio.

    (comment by Claude)
    */
    let clipping = false;
    if (Utils.isNexContainer(wt)) {
      for (let i = 0; i < wt.numChildren(); i++) {
        let child = wt.getChildAt(i);
        buffers.push(child.getCachedBuffer());
        if (child.getAmp && child.getAmp() > 1) clipping = true;
      }
    } else {
      buffers.push(wt.getCachedBuffer());
      if (wt.getAmp && wt.getAmp() > 1) clipping = true;
    }

    let channelnumbers = [1, 2];
    let clip = null;

    /*
    A nil second argument is handled before it gets here -- an optional
    parameter given nil is bound as though it were not given at all -- so
    arg is UNBOUND in that case and the defaults below apply.

    The cost is a diagnostic that used to be here: a clip deleted since it
    was made also evaluates to nil, and that was reported rather than quietly
    becoming "play on the default channels". Both arrive as the same value,
    so only one of them can be served.
    */
    if (arg != UNBOUND && Utils.isClip(arg)) {
      if (arg.getKind() != "audio loop") {
        return { error: constructFatalError(name + ": that is not an audio clip. Sorry!") };
      }
      clip = arg;
      channelnumbers = clip.getChannels();
      // Out at the boundary and back in at the same one, so the swap is not
      // heard. Nothing here has to know how a loop is put together.
      endLoops(clip.getIds(), true /* at the cycle end */);
    } else if (arg != UNBOUND) {
      channelnumbers = [];
      if (Utils.isNexContainer(arg)) {
        for (let i = 0; i < arg.numChildren(); i++) {
          channelnumbers.push(arg.getChildAt(i).getTypedValue());
        }
      } else {
        channelnumbers.push(arg.getTypedValue());
      }
    }

    let converted = toChannelIndexes(channelnumbers, name);
    if (converted.error) return { error: converted.error };
    let ids = loopPlay(buffers, converted.indexes);
    let what =
        "channel" + (channelnumbers.length == 1 ? " " : "s ") + channelnumbers.join(", ");
    if (clip) {
      clip.setIds(ids, what);
    } else {
      clip = constructClip("audio loop", what, ids, endLoops, channelnumbers);
    }
    // a replaced clip is playing something else now, so this is answered
    // again rather than left as it was
    // (comment by Claude)
    clip.setClipping(clipping);
    // the audio system owns it while it plays, and how long that lasts is
    // decided by whether anything else owns it too
    clipStartedPlaying(clip, ids);
    return { clip: clip };
  }

  Builtin.createBuiltin(
    "play",
    ["wt_", "channelsorclip#%()μ∅?"],
    function $loopPlay(env, executionEnvironment) {
      let r = startPlaying(env.lb("wt"), env.lb("channelsorclip"), "play");
      return r.error ? r.error : r.clip;
    },
    "Plays a loop. Returns a clip. Replaces |clip if passed in."
  );

  // what it was called before it could do both
  Builtin.aliasBuiltin("loop-play", "play");

  Builtin.createBuiltin(
    "play-with-bpm",
    ["bpm#%", "wt_", "channelsorclip#%()μ∅?"],
    function $playWithBpm(env, executionEnvironment) {
      let bpm = env.lb("bpm").getTypedValue();
      if (!(bpm > 0)) {
        return constructFatalError("play-with-bpm: bpm must be more than zero. Sorry!");
      }
      let r = startPlaying(env.lb("wt"), env.lb("channelsorclip"), "play-with-bpm");
      if (r.error) return r.error;
      /*
      The tempo changes when this starts sounding, not now. Going from a fast
      passage to a slow one, the moment that matters is the downbeat of the
      slow one: set the tempo when you ask and everything between here and
      there is measured against a tempo that is not playing yet.

      The same boundary the loop joins at, because it is the same event -- see
      atNextCycleStart.

      (comment by Claude)
      */
      atNextCycleStart(function() {
        setBpm(bpm);
      });
      return r.clip;
    },
    "Like play, but sets the tempo to |bpm when the loop starts sounding rather than at once, so the change lands on the downbeat. |wt and |channelsorclip are as in play."
  );

  Builtin.createBuiltin(
    "break",
    ["wt_"],
    function $break(env, executionEnvironment) {
      let wt = env.lb("wt");

      let buffers = [];
      if (Utils.isNexContainer(wt)) {
        for (let i = 0; i < wt.numChildren(); i++) {
          buffers.push(wt.getChildAt(i).getCachedBuffer());
        }
      } else {
        buffers.push(wt.getCachedBuffer());
      }

      /*
      No second argument, unlike play. There is nothing for one to say: a break
      is not a loop you keep a handle on and replace later, it happens once and
      is over, so there is no clip to hand back and no clip to be given. The
      channels are the ones play uses when it is not told otherwise.

      (comment by Claude)
      */
      let converted = toChannelIndexes([1, 2], "break");
      if (converted.error) return converted.error;
      queueBreak(buffers, converted.indexes);
      return constructNil();
    },
    "Stops everything at the end of the measure and plays |wt once. Anything started meanwhile begins when it ends. Start nothing and everything stops."
  );

  Builtin.createBuiltin(
    "audio-channels",
    [],
    function $audioChannels(env, executionEnvironment) {
      let n = getAudioChannelCount();
      let r = constructOrg();
      for (let i = 1; i <= n; i++) {
        r.appendChild(constructInteger(i));
      }
      // one short row rather than a tall column
      // (comment by Claude)
      r.setHorizontal();
      return r;
    },
    "The audio outputs of this device, as channel numbers counting from 1, which is what play takes. Asking opens the device; the answer is fixed until reload."
  );

  Builtin.createBuiltin(
    "start-recording",
    ["_wt_", "channel#?"],
    function $startRecording(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      let channel = env.lb("channel");
      // 1-based to the user, the way audio hardware numbers channels
      // (comment by Claude)
      let n = channel == UNBOUND ? 1 : channel.getTypedValue();
      if (n < 1) {
        return constructFatalError("start-recording: there is no channel " + n + ". Sorry!");
      }
      let unlimited = false;
      for (let i = 0; commandTags && i < commandTags.length; i++) {
        if (commandTags[i].getTagString() == "unlimited") {
          unlimited = true;
        }
      }
      startRecordingAudio(wt, n - 1, unlimited);
      return wt;
    },
    "Records into |wt from |channel, or channel 1. A wavetable holds one channel, so stereo is recorded one side at a time. Stops after 30 seconds unless tagged unlimited."
  );

  Builtin.createBuiltin(
    "stop-recording",
    ["_wt_"],
    function $startRecording(env, executionEnvironment) {
      let wt = env.lb("wt");
      stopRecordingAudio(wt);
      return wt;
    },
    "Stops |wt recording."
  );

  Builtin.createBuiltin(
    "abort-playback",
    ["channel#?"],
    function $abortPlayback(env, executionEnvironment) {
      let channel = env.lb("channel");
      // -1 is every channel, which is what no argument means
      // (comment by Claude)
      let channelnumber = -1;
      if (channel != UNBOUND) {
        let converted = toChannelIndexes([channel.getTypedValue()], "abort-playback");
        if (converted.error) return converted.error;
        channelnumber = converted.indexes[0];
      }

      abortPlayback(channelnumber);
      return constructNil();
    },
    "Stops playback on |channel, or on all of them."
  );

  Builtin.createBuiltin(
    "split",
    ["wt_"],
    function $play(env, executionEnvironment) {
      let wt = env.lb("wt");
      let r = constructOrg();
      for (let i = 0; i < wt.numSections(); i++) {
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
    "|wt cut at its split points, as an org of waves."
  );

  Builtin.createBuiltin(
    "wave-to-samples",
    ["wt_"],
    function $waveToSamples(env, executionEnvironment) {
      let wt = env.lb("wt");
      let data = wt.getData();
      let r = constructOrg();
      for (let i = 0; i < data.length; i++) {
        r.appendChild(constructFloat(data[i]));
      }
      return r;
    },
    "|wt as an org of floats, one per sample. A second is tens of thousands of them, so this is for short waves."
  );

  Builtin.createBuiltin(
    "samples-to-wave",
    ["samples()"],
    function $samplesToWave(env, executionEnvironment) {
      let samples = env.lb("samples");
      let n = samples.numChildren();
      if (n == 0) {
        return constructFatalError("samples-to-wave: nothing to make a wave out of. Sorry!");
      }
      let r = constructWavetable(n);
      let data = r.getData();
      for (let i = 0; i < n; i++) {
        let c = samples.getChildAt(i);
        if (!Utils.isFloat(c) && !Utils.isInteger(c)) {
          return constructFatalError(
              "samples-to-wave: item " + (i + 1) + " is not a number. Sorry!");
        }
        data[i] = c.getTypedValue();
      }
      r.init();
      return r;
    },
    "|samples, an org of numbers, as a wavetable. The reverse of wave-to-samples."
  );

  /*
  A shape is a wave read as a lookup table rather than as a sound. Its length
  spans an input of -1 to 1 and the value at each point is what comes out, so a
  straight line changes nothing and any bend in it is a distortion. Every kind
  of shaping is then one wave, which you can build with the wave math, draw by
  hand, or record -- rather than a builtin apiece with its own loop.
  */
  const SHAPE_SAMPLES = 1024;

  function constructShape(f) {
    let r = constructWavetable(SHAPE_SAMPLES);
    let data = r.getData();
    for (let i = 0; i < SHAPE_SAMPLES; i++) {
      data[i] = f((i / (SHAPE_SAMPLES - 1)) * 2 - 1);
    }
    r.init();
    return r;
  }

  Builtin.createBuiltin(
    "waveshape",
    ["wt_", "shape_"],
    function $waveshape(env, executionEnvironment) {
      let wt = env.lb("wt");
      let shape = env.lb("shape");
      let n = shape.getDuration();
      if (n < 2) {
        return constructFatalError("waveshape: that shape is too short to read. Sorry!");
      }

      let dur = wt.getDuration();
      let r = constructWavetable(dur);
      let data = r.getData();
      for (let i = 0; i < dur; i++) {
        // anything past the limit reads the end of the shape, so a shape that
        // levels off there clips and one that turns back around folds
        let v = wt.valueAtSample(i);
        if (v < -1) v = -1;
        if (v > 1) v = 1;
        data[i] = shape.interpolatedValueAtSample(((v + 1) / 2) * (n - 1));
      }
      r.init();
      return r;
    },
    "Puts every sample of |wt through |shape, a wave read as a lookup table spanning an input of -1 to 1. See transfer-wavefold, transfer-clipping and transfer-compress."
  );


  Builtin.createBuiltin(
    "transfer-wavefold",
    ["folds#%?"],
    function $transferWavefold(env, executionEnvironment) {
      let folds = env.lb("folds");
      folds = folds == UNBOUND ? 2 : folds.getTypedValue();
      if (folds < 1) {
        return constructFatalError("transfer-wavefold: folds must be at least 1. Sorry!");
      }
      /*
      Folding used to mean driving a signal past the limit and reflecting what
      went over. A shape cannot see past its own ends, so how hard it folds is
      |folds instead of how hard you drove it -- which is the same control by a
      different name, and it does not lose the part of the signal that a shape
      would otherwise have to clip.
      */
      return constructShape(function (x) {
        return foldInto(x * folds);
      });
    },
    "A shape for waveshape. Anything past the limit turns back on itself instead of flattening. |folds is how many times it turns back, 2 by default; 1 is a straight line."
  );

  Builtin.createBuiltin(
    "transfer-clipping",
    ["amount%?"],
    function $transferClipping(env, executionEnvironment) {
      let amount = env.lb("amount");
      amount = amount == UNBOUND ? 3 : amount.getTypedValue();
      if (amount <= 0) {
        return constructFatalError("transfer-clipping: amount must be more than 0. Sorry!");
      }
      // scaled so that the shape still reaches the limit at the limit, rather
      // than everything simply getting quieter as you turn it up
      let full = Math.tanh(amount);
      return constructShape(function (x) {
        return Math.tanh(amount * x) / full;
      });
    },
    "A shape for waveshape. Rounds off near the limit instead of chopping flat, the way tape does. |amount is how hard it bends, 3 by default; small numbers are nearly straight."
  );

  Builtin.createBuiltin(
    "transfer-compress",
    ["threshold%?", "ratio%?"],
    function $transferCompress(env, executionEnvironment) {
      let threshold = env.lb("threshold");
      let ratio = env.lb("ratio");
      threshold = threshold == UNBOUND ? 0.5 : threshold.getTypedValue();
      ratio = ratio == UNBOUND ? 4 : ratio.getTypedValue();
      if (threshold <= 0 || threshold >= 1) {
        return constructFatalError("transfer-compress: threshold must be between 0 and 1. Sorry!");
      }
      if (ratio < 1) {
        return constructFatalError("transfer-compress: ratio must be at least 1. Sorry!");
      }
      // makeup gain, so the quiet part comes up rather than the loud part
      // simply going down
      let ceiling = threshold + (1 - threshold) / ratio;
      return constructShape(function (x) {
        let sign = x < 0 ? -1 : 1;
        let a = Math.abs(x);
        let y = a <= threshold ? a : threshold + (a - threshold) / ratio;
        return (sign * y) / ceiling;
      });
    },
    /*
    Worth knowing what this is not: a real compressor watches the signal over
    time and has an attack and a release. A shape has no memory, so this is the
    instantaneous part only -- the curve, without the timing.
    */
    "A shape for waveshape. Reduces anything above |threshold by |ratio, then rescales so full scale is unchanged. Defaults 0.5 and 4. The curve only: no attack, no release."
  );

  /*
  The two ways a digital sound is made cheap, which are not the same thing.
  bitcrush is about how finely a sample is measured; sample-reduce is about how
  often. Neither is a shape you could hand to waveshape: one is a staircase too
  fine to draw as a wave, and the other happens over time rather than sample by
  sample.

  (comment by Claude)
  */
  Builtin.createBuiltin(
    "bitcrush",
    ["wt_", "bits#%_?"],
    function $bitcrush(env, executionEnvironment) {
      let wt = env.lb("wt");
      let bits = amountAt(env.lb("bits"), 8);

      let dur = Math.max(wt.getDuration(), longestWave(env.lb("bits")));
      let r = constructWavetable(dur);
      let data = r.getData();
      for (let i = 0; i < dur; i++) {
        let b = bits(i);
        if (b < 1) b = 1;
        if (b > 32) b = 32;
        // half the levels either side of zero, so silence stays silent
        // (comment by Claude)
        let half = Math.pow(2, b) / 2;
        data[i] = Math.round(wt.valueAtSample(i) * half) / half;
      }
      r.init();
      return r;
    },
    "Rounds every sample of |wt to one of |bits levels, default 8. |bits may be a wave. This is how finely each sample is measured; sample-reduce is how often."
  );

  Builtin.createBuiltin(
    "sample-reduce",
    ["wt_", "hold#%_"],
    function $sampleReduce(env, executionEnvironment) {
      let wt = env.lb("wt");
      let holdFor = lengthAt(env.lb("hold"));

      /*
      Held rather than resampled, because the aliasing is the whole point.
      resample-by interpolates, which is the right thing there and removes
      exactly the ringing that makes this sound like cheap hardware.

      (comment by Claude)
      */
      let dur = Math.max(wt.getDuration(), longestWave(env.lb("hold")));
      let r = constructWavetable(dur);
      let data = r.getData();
      let held = 0;
      let left = 0;
      for (let i = 0; i < dur; i++) {
        if (left <= 0) {
          held = wt.valueAtSample(i);
          let h = holdFor(i);
          left += h > 1 ? h : 1;
        }
        data[i] = held;
        left -= 1;
      }
      r.init();
      return r;
    },
    "Holds each sample of |wt for |hold samples before taking the next. Tag |hold with hz for a rate. |hold may be a wave. This is how often the sound is measured; bitcrush is how finely."
  );

  Builtin.createBuiltin(
    "reverse",
    ["wt_"],
    function $reverse(env, executionEnvironment) {
      let wt = env.lb("wt");

      let dur = wt.getDuration();
      let r = constructWavetable(dur);
      let data = r.getData();
      for (let i = 0; i < dur; i++) {
        data[i] = wt.valueAtSample(dur - i);
      }
      r.init();
      return r;
    },
    "|wt backwards."
  );

  Builtin.createBuiltin(
    "constant",
    ["val#%?", "len#%?"],
    function $const(env, executionEnvironment) {
      let len = env.lb("len");
      let val = env.lb("val");

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
    "A wave of the constant |val, |len long. Timebase tag goes on |len."
  );

  Builtin.createBuiltin(
    "singlepole",
    ["wt1_", "wt2#%_"],
    function $singlepole(env, executionEnvironment, commandTags) {
      let wt1 = env.lb("wt1");
      let wt2 = env.lb("wt2");
      let kind = filterKindFromTags(commandTags, ["low", "high"]);
      if (kind == "conflict") {
        return filterKindError("singlepole", ["low", "high"]);
      }

      /*
      Read the same way doublepole reads its cutoff: by ear rather than by
      hertz, so a wave used as |wt2 sweeps evenly instead of crossing
      everything audible in its last few percent. It also brings the timebase
      tags with it, so a cutoff can be named in hz or as a note.
      */
      let cutoffAt = frequencyAt(wt2);

      let dur = Math.max(wt1.getDuration(), longestWave(wt2));
      let r = constructWavetable(dur);
      let data = r.getData();
      let yk = wt1.valueAtSample(0);

      for (let i = 0; i < dur; i++) {
        let wt1val = wt1.valueAtSample(i);
        let cutoff = cutoffAt(i);
        /*
        How far towards the input each sample moves. Past one it overshoots and
        rings, and there was nothing stopping that before: cutoff came straight
        off the control wave, so a wave that went negative -- which any wave
        used as a sweep does -- made alpha negative and the filter ran away.
        */
        let alpha = cutoff / getSampleRate();
        if (alpha > 1) alpha = 1;
        if (alpha < 0) alpha = 0;
        yk += alpha * (wt1val - yk);
        // one pole highpass is just whatever the lowpass did not keep
        // (comment by Claude)
        data[i] = kind == "high" ? wt1val - yk : yk;
      }
      r.init();
      return r;
    },
    "One pole filter on |wt1 with cutoff |wt2, a number or a wave. |wt2 runs 0 to 1 across the range of hearing, by ear rather than by hertz; tag it hz or nn for a real frequency. Tag the command low or high, default low. Does not resonate; use doublepole."
  );


  /*
  Cutoff runs 0 to 1 across the range of hearing, and crosses it the way hearing
  does: an equal step in the number is an equal musical interval, not an equal
  number of hertz.

  Linear was no good for the thing cutoff is most wanted for. Twenty thousand
  hertz spread evenly over 0 to 1 puts everything below a kilohertz -- which is
  to say nearly everything you can hear as pitch -- in the bottom twentieth of
  the number, so a ramp through a filter sat wide open for most of its length
  and then crossed the entire audible range in its last few percent. It did not
  sound like a sweep because it was not one.

  Twenty hertz at zero rather than nought, because nought has no logarithm and
  because a filter at twenty hertz is already shut as far as hearing is
  concerned. Below zero -- a wave used as a sweep swings both ways -- it keeps
  going down and biquadInto floors it.
  */


  function explicitTimebase(nex) {
    for (let i = 0; i < nex.numTags(); i++) {
      let t = timebaseForTagString(nex.getTag(i).getTagString());
      if (t) return t;
    }
    return null;
  }

  /*
  A tagged wave names real frequencies, the same way a tagged number does. An
  untagged one keeps the minus one to one mapping, because that is the useful
  thing to hand a filter from an oscillator and it is what the untagged number
  case already means.

  (comment by Claude)
  */
  function frequencyAt(nex) {
    if (nex.getTypeName() == "-wavetable-") {
      let timebase = explicitTimebase(nex);
      if (timebase) {
        return function (i) {
          let samples = convertTimeToSamples(nex.valueAtSample(i), timebase);
          return samples > 0 ? getSampleRate() / samples : 0;
        };
      }
      return function (i) {
        return cutoffToHz(nex.valueAtSample(i));
      };
    }
    let hz;
    if (explicitTimebase(nex)) {
      // a tagged number names a real frequency and is taken at its word
      let samples = convertTimeToSamples(nex);
      hz = samples > 0 ? getSampleRate() / samples : 0;
    } else {
      hz = cutoffToHz(nex.getTypedValue());
    }
    return function (i) {
      return hz;
    };
  }

  /*
  The longest of the arguments, counting only the ones that are waves.

  A modulator shorter than the sound loops to fill it, which valueAtSample does
  by itself; the part that has to be decided here is how long the result is. It
  is the longest thing that went in, so a modulator longer than the sound makes
  the sound loop rather than being cut off at the sound's length -- which is
  what slew and singlepole already do, and what everything taking a wave for a
  parameter should do.
  */
  function longestWave() {
    let n = 0;
    for (let i = 0; i < arguments.length; i++) {
      let x = arguments[i];
      if (x && x != UNBOUND && x.getTypeName
          && x.getTypeName() == "-wavetable-" && x.getDuration() > n) {
        n = x.getDuration();
      }
    }
    return n;
  }

  function amountAt(nex, dflt) {
    if (nex == UNBOUND) {
      return function (i) {
        return dflt;
      };
    }
    if (nex.getTypeName() == "-wavetable-") {
      return function (i) {
        return nex.valueAtSample(i);
      };
    }
    let v = nex.getTypedValue();
    return function (i) {
      return v;
    };
  }

  /*
  Which filter it is, taken from a tag on the command rather than an argument:
  <low>doublepole, not doublepole with "low" on the end. Naming the kind is not
  the same act as handing it a cutoff -- the kind is which command you meant,
  and it never moves while a sound plays, so it does not belong among the
  things that can be waves.

  No tag means the first allowed kind, which is the one you nearly always want.
  Two kinds at once is an error rather than a silent first-wins, because a
  <low> that was meant to replace a <high> and did not would be very hard to
  hear.

  (comment by Claude)
  */
  function filterKindFromTags(commandTags, allowed) {
    let found = null;
    for (let i = 0; commandTags && i < commandTags.length; i++) {
      let s = commandTags[i].getTagString().trim().toLowerCase();
      // lowpass and low are the same word said two ways
      // (comment by Claude)
      if (s.endsWith("pass")) s = s.substring(0, s.length - 4);
      if (allowed.indexOf(s) == -1) continue;
      if (found && found != s) return "conflict";
      found = s;
    }
    return found ? found : allowed[0];
  }

  function filterKindError(name, allowed) {
    return constructFatalError(
        name + ": tag the command with one of "
        + allowed.map(k => "<" + k + ">").join(", ")
        + " to say which kind of filter it is. Sorry!");
  }

  /*
  Resonance runs 0 to 1 rather than being a Q, because 0 to 1 is what a knob
  does. It has to live inside the filter's own loop -- feeding a filter back
  into itself from outside cannot get you here.

  (comment by Claude)
  */


  Builtin.createBuiltin(
    "doublepole",
    ["wt_", "cutoff#%_", "resonance#%_?"],
    function $doublepole(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      const KINDS = ["low", "high", "band", "notch"];
      let kind = filterKindFromTags(commandTags, KINDS);
      if (kind == "conflict") {
        return filterKindError("doublepole", KINDS);
      }
      let cutoff = frequencyAt(env.lb("cutoff"));
      let resonance = amountAt(env.lb("resonance"), 0);

      let dur = Math.max(wt.getDuration(),
          longestWave(env.lb("cutoff"), env.lb("resonance")));
      let r = constructWavetable(dur);
      let data = r.getData();
      let sampleRate = getSampleRate();
      let c = [0, 0, 0, 0, 0];
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < dur; i++) {
        biquadInto(c, kind, cutoff(i), resonanceToQ(resonance(i)), 0, sampleRate);
        let x = wt.valueAtSample(i);
        let y = c[0] * x + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
        x2 = x1;
        x1 = x;
        y2 = y1;
        y1 = y;
        data[i] = y;
      }
      r.init();
      return r;
    },
    "Two pole filter on |wt. Tag the command low, high, band or notch; low by default. |cutoff runs 0 to 1 across the range of hearing, by ear rather than by hertz, so halfway is about 630Hz and a wave sweeps evenly. Tag it hz or nn for a real frequency. |resonance runs 0 to 1. Both may be waves."
  );

  Builtin.createBuiltin(
    "param-eq",
    ["wt_", "freq#%_", "gain#%_", "q#%_?"],
    function $paramEq(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      const KINDS = ["peak", "lowshelf", "highshelf"];
      let kind = filterKindFromTags(commandTags, KINDS);
      if (kind == "conflict") {
        return filterKindError("param-eq", KINDS);
      }
      let freq = frequencyAt(env.lb("freq"));
      let gain = amountAt(env.lb("gain"), 0);
      let q = amountAt(env.lb("q"), 1);

      /*
      One band per call. Chaining calls is how you get a whole eq, and it
      reads better than pairing up parallel lists of frequencies and gains.
      Unlike a filter this leaves everything outside the band alone, which is
      what makes it the thing you reach for when a sound is nearly right.

      (comment by Claude)
      */
      let dur = Math.max(wt.getDuration(),
          longestWave(env.lb("freq"), env.lb("gain"), env.lb("q")));
      let r = constructWavetable(dur);
      let data = r.getData();
      let sampleRate = getSampleRate();
      let c = [0, 0, 0, 0, 0];
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < dur; i++) {
        biquadInto(c, kind, freq(i), q(i), gain(i), sampleRate);
        let x = wt.valueAtSample(i);
        let y = c[0] * x + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
        x2 = x1;
        x1 = x;
        y2 = y1;
        y1 = y;
        data[i] = y;
      }
      r.init();
      return r;
    },
    "One band of parametric eq on |wt: |gain decibels around |freq, |q wide, higher being narrower, default 1. Tag the command peak, lowshelf or highshelf, default peak. |freq is a fraction of 20kHz, or tag it hz or nn. All three may be waves."
  );

  Builtin.createBuiltin(
    "convolve",
    ["wt_", "ir_"],
    function $convolve(env, executionEnvironment) {
      let wt = env.lb("wt");
      let ir = env.lb("ir");

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
            let wtValue = wtIndex >= wtLen ? 0.0 : wt.valueAtSample(wtIndex);
            sum += irValue * wtValue;
          }
        }
        rdata[outIndex] = sum;
      }
      r.init();
      return r;
    },
    "Convolves |wt with |ir. An impulse response gives reverb; anything else gives a hybrid. Slow."
  );

  Builtin.createBuiltin(
    "slew",
    ["wt1_", "wt2#%_"],
    function $slew(env, executionEnvironment) {
      let wt1 = env.lb("wt1");
      let wt2 = env.lb("wt2");

      if (!(wt2.getTypeName() == "-wavetable-")) {
        wt2 = getConstantSignalFromValue(
          wt2.getTypedValue(),
          wt1.getDuration()
        );
        sAttach(wt2);
      }

      let dur = Math.max(wt1.getDuration(), wt2.getDuration());
      let r = constructWavetable(dur);
      let data = r.getData();

      let previousValue = wt1.valueAtSample(0);
      data[0] = previousValue;
      for (let i = 1; i < dur; i++) {
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
    "Limits how far |wt1 may move from one sample to the next, by |wt2. For a signal in -1 to 1, a |wt2 in 0 to 1 is the useful range."
  );

  /*
  Two waves and a third one saying, sample by sample, how far between them to
  be. The two sources are read with valueAtSample, which wraps, so a pair of
  single-cycle waves against a control that is seconds long is the ordinary
  case and not a special one: the waves cycle underneath while the control
  sweeps across, which is the wavetable sweep you actually want.

  That also decides the length. It is the longest of the three rather than the
  longest of the two sources, because a control shorter than the output would
  wrap and sweep repeatedly, which is a thing you would have to ask for rather
  than something to hand someone who passed a one-shot envelope.

  |amt is read as -1 to 1, the range a wave already lives in, so any wave can
  drive this without being converted first. An envelope that runs 0 to 1 is
  the thing that needs converting, and it converts in one step:

      ~(_offset %-1 ~(_gain %2 ~(_ramp _)_)_)
  */
  Builtin.createBuiltin(
    "morph",
    ["wt1_", "wt2_", "amt#%_"],
    function $morph(env, executionEnvironment) {
      let wt1 = env.lb("wt1");
      let wt2 = env.lb("wt2");
      let amt = env.lb("amt");

      let dur = Math.max(wt1.getDuration(), wt2.getDuration());
      if (amt.getTypeName() == "-wavetable-") {
        dur = Math.max(dur, amt.getDuration());
      } else {
        amt = getConstantSignalFromValue(amt.getTypedValue(), dur);
        sAttach(amt);
      }
      if (dur <= 0) {
        return constructFatalError("morph: nothing to morph, a wave has no length");
      }

      let r = constructWavetable(dur);
      let data = r.getData();
      for (let i = 0; i < dur; i++) {
        let t = (amt.valueAtSample(i) + 1) / 2;
        // past the ends there is nothing to interpolate toward, so it holds
        // rather than extrapolating into whatever is louder than the sources
        if (t < 0) {
          t = 0;
        } else if (t > 1) {
          t = 1;
        }
        data[i] = wt1.valueAtSample(i) * (1 - t) + wt2.valueAtSample(i) * t;
      }
      r.init();
      return r;
    },
    "Mixes |wt1 and |wt2, with |amt saying where between them each sample falls: -1 is all |wt1, 1 is all |wt2, 0 is halfway. |amt is usually a third wave, which is what makes this a sweep rather than a fixed mix. The result is as long as the longest argument; shorter waves cycle."
  );

  Builtin.createBuiltin(
    "noise",
    ["len#%?"],
    function $noise(env, executionEnvironment) {
      let len = env.lb("len");
      if (len == UNBOUND) {
        len = constructInteger(getReferenceFrequency());
        len.addTag(newTagOrThrowOOM("hz", "noise wavetable builtin, timebase"));
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
    "White noise, |len long. Timebase tag goes on |len."
  );

  Builtin.createBuiltin(
    "sinewave",
    ["nn#%?"],
    function $sinewave(env, executionEnvironment) {
      let nn = env.lb("nn");
      if (nn == UNBOUND) {
        nn = constructInteger(getReferenceFrequency());
        nn.addTag(
          newTagOrThrowOOM("hz", "sinewave wavetable builtin, timebase")
        );
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
    "One cycle of a sine wave, |nn long. Timebase tag goes on |nn."
  );

  Builtin.createBuiltin(
    "gate",
    ["nn#%?"],
    function $squarewave(env, executionEnvironment) {
      let nn = env.lb("nn");
      if (nn == UNBOUND) {
        nn = constructInteger(1);
        nn.addTag(newTagOrThrowOOM("b", "gate wavetable builtin, timebase"));
        sAttach(nn);
      }

      let dur = convertTimeToSamples(nn);
      let r = constructWavetable(dur);
      let data = r.getData();

      for (let i = 0; i < dur; i++) {
        if (i < dur / 2) {
          data[i] = 0;
        } else {
          data[i] = 1;
        }
      }
      r.init();
      return r;
    },
    "A gate signal, |nn long. Timebase tag goes on |nn."
  );

  Builtin.createBuiltin(
    "squarewave",
    ["nn#%?"],
    function $squarewave(env, executionEnvironment) {
      let nn = env.lb("nn");
      if (nn == UNBOUND) {
        nn = constructInteger(getReferenceFrequency());
        nn.addTag(
          newTagOrThrowOOM("hz", "squarewave wavetable builtin, timebase")
        );
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
        for (let k = 1; k <= numHarmonics; k++) {
          let oddnum = k * 2 - 1;
          let v = (1 / oddnum) * Math.sin(oddnum * omega * time);
          s += v;
        }
        data[i] = s * (4 / Math.PI);
      }
      r.init();
      return r;
    },
    "One cycle of a square wave, |nn long. Timebase tag goes on |nn."
  );

  Builtin.createBuiltin(
    "trianglewave",
    ["nn#%?"],
    function $trianglewave(env, executionEnvironment) {
      let nn = env.lb("nn");
      if (nn == UNBOUND) {
        nn = constructInteger(getReferenceFrequency());
        nn.addTag(
          newTagOrThrowOOM("hz", "trianglewave wavetable builtin, timebase")
        );
        sAttach(nn);
      }

      let dur = convertTimeToSamples(nn);
      let r = constructWavetable(dur);
      let data = r.getData();

      /*
      Odd harmonics again, like a square, but falling off as 1/k squared rather
      than 1/k, with every other one inverted. That much steeper fall-off is why
      a triangle sounds so much softer than a square, and why sixteen partials
      is already more than you can hear.
      */
      let numHarmonics = 16;
      let freq = (1 / dur) * getSampleRate();
      for (let i = 0; i < dur; i++) {
        let omega = 2 * Math.PI * freq;
        let time = (1 / getSampleRate()) * i;

        let s = 0;
        for (let k = 1; k <= numHarmonics; k += 2) {
          let sign = ((k - 1) / 2) % 2 == 0 ? 1 : -1;
          s += sign * (1 / (k * k)) * Math.sin(k * omega * time);
        }
        data[i] = s * (8 / (Math.PI * Math.PI));
      }
      r.init();
      return r;
    },
    "One cycle of a triangle wave, |nn long, built from partials so it does not alias, running -1 to 1. Timebase tag goes on |nn."
  );

  Builtin.createBuiltin(
    "sawwave",
    ["nn#%?"],
    function $sawwave(env, executionEnvironment) {
      let nn = env.lb("nn");
      if (nn == UNBOUND) {
        nn = constructInteger(getReferenceFrequency());
        nn.addTag(
          newTagOrThrowOOM("hz", "sawwave wavetable builtin, timebase")
        );
        sAttach(nn);
      }

      let dur = convertTimeToSamples(nn);
      let r = constructWavetable(dur);
      let data = r.getData();

      /*
      Built out of partials, the same way squarewave is, rather than as a
      straight line. A real saw has every harmonic falling off as 1/k, and
      stopping at sixteen of them is what keeps it from aliasing into a mess at
      high pitches. The ideal sharp-cornered version is what ramp already is.
      */
      let numHarmonics = 16;
      let freq = (1 / dur) * getSampleRate();
      for (let i = 0; i < dur; i++) {
        let omega = 2 * Math.PI * freq;
        let time = (1 / getSampleRate()) * i;

        let s = 0;
        for (let k = 1; k <= numHarmonics; k++) {
          let sign = k % 2 == 1 ? 1 : -1;
          s += sign * (1 / k) * Math.sin(k * omega * time);
        }
        data[i] = s * (2 / Math.PI);
      }
      r.init();
      return r;
    },
    "One cycle of a saw wave, |nn long, built from partials so it does not alias, running -1 to 1. For the straight-line version use ramp. Timebase tag goes on |nn."
  );

  Builtin.createBuiltin(
    "ramp",
    ["len#%?"],
    function $ramp(env, executionEnvironment) {
      let len = env.lb("len");
      if (len == UNBOUND) {
        len = constructInteger(1);
        len.addTag(
          newTagOrThrowOOM("seconds", "ramp wavetable builtin, timebase")
        );
        sAttach(len);
      }

      let dur = convertTimeToSamples(len);
      let r = constructWavetable(dur);
      let data = r.getData();

      for (let i = 0; i < dur; i++) {
        let d = 1.0 - i / dur;
        data[i] = d;
      }
      r.init();
      return r;
    },
    "A ramp from one to zero, |len long. Timebase tag goes on |len."
  );

  /*
  Changing how long a sound is without changing its pitch means cutting it into
  overlapping pieces and laying them back down at a different spacing. Laid down
  at the spacing they came from, the pieces still line up and nothing has moved;
  at any other spacing they do not, and where two pieces disagree about where a
  waveform is you hear a click.

  So each piece is not taken from exactly where the arithmetic says, but from
  the best matching place within a short distance of it -- the place where the
  wave continues most like the piece before it did. That search is the whole
  trick, and it is why this sounds like the sound rather than like a stutter.

  (comment by Claude)
  */
  const STRETCH_MAX_OUTPUT = 10000000;


  function stretchedLength(dur, factor) {
    let outDur = Math.round(dur * factor);
    return outDur < 1 ? 1 : outDur;
  }

  Builtin.createBuiltin(
    "time-stretch",
    ["wt_", "amount#%"],
    function $timeStretch(env, executionEnvironment) {
      let wt = env.lb("wt");
      let amount = env.lb("amount");
      let dur = wt.getDuration();
      if (dur < 2) {
        return constructFatalError("time-stretch: nothing to stretch. Sorry!");
      }

      // tagged with a timebase it is the length you want; untagged it is how
      // many times longer to make it
      // (comment by Claude)
      let factor;
      if (explicitTimebase(amount)) {
        factor = convertTimeToSamples(amount) / dur;
      } else {
        factor = amount.getTypedValue();
      }
      if (!(factor > 0)) {
        return constructFatalError("time-stretch: length must be more than zero. Sorry!");
      }
      let outDur = stretchedLength(dur, factor);
      if (outDur > STRETCH_MAX_OUTPUT) {
        return constructFatalError("time-stretch: that would be too long to hold. Sorry!");
      }
      let r = constructWavetable(outDur);
      stretchInto(wt, factor, r.getData(), outDur);
      r.init();
      return r;
    },
    "Makes |wt |amount times longer without changing its pitch. Tag |amount with a timebase to give a length instead of a multiple."
  );

  Builtin.createBuiltin(
    "pitch-shift",
    ["wt_", "semitones#%"],
    function $pitchShift(env, executionEnvironment) {
      let wt = env.lb("wt");
      let semitones = env.lb("semitones").getTypedValue();
      let dur = wt.getDuration();
      if (dur < 2) {
        return constructFatalError("pitch-shift: nothing to shift. Sorry!");
      }
      if (semitones < -48 || semitones > 48) {
        return constructFatalError("pitch-shift: that is more than four octaves. Sorry!");
      }

      /*
      Stretch it, then play the stretched copy back that many times as fast.
      The speed change moves the pitch and undoes the stretch at the same time,
      so what is left is the original length at a different pitch. Which is why
      this is a function rather than anything new: it is time-stretch and
      resample-by, one after the other.

      (comment by Claude)
      */
      let ratio = Math.pow(2, semitones / 12);
      let longDur = stretchedLength(dur, ratio);
      if (longDur > STRETCH_MAX_OUTPUT) {
        return constructFatalError("pitch-shift: that would be too long to hold. Sorry!");
      }
      let stretched = new Float64Array(longDur);
      stretchInto(wt, ratio, stretched, longDur);

      let r = constructWavetable(dur);
      let data = r.getData();
      let last = longDur - 1;
      for (let i = 0; i < dur; i++) {
        let at = i * ratio;
        if (at > last) at = last;
        let i0 = Math.floor(at);
        let frac = at - i0;
        let a = stretched[i0];
        let b = i0 + 1 <= last ? stretched[i0 + 1] : a;
        data[i] = a + (b - a) * frac;
      }
      r.init();
      return r;
    },
    "Moves |wt by |semitones without changing its length. Negative goes down; fractions are allowed."
  );

  Builtin.createBuiltin(
    "resample-to",
    ["wt_", "freq#%_?"],
    function $resampleTo(env, executionEnvironment) {
      let wt = env.lb("wt");
      let freq = env.lb("freq");
      if (freq == UNBOUND) {
        freq = constructInteger(1);
        freq.addTag(
          newTagOrThrowOOM("seconds", "resample wavetable builtin, timebase")
        );
        sAttach(freq);
      }
      if (!(freq.getTypeName() == "-wavetable-")) {
        let tag = freq.hasTags() ? freq.getTag(0) : null;
        freq = getConstantSignalFromValue(freq.getTypedValue());
        if (tag) {
          freq.addTag(tag);
        }
      }

      let timebase = nexToTimebase(freq);
      let oldDuration = wt.getDuration();
      let freqDuration = freq.getDuration();

      // IDK if there's a smarter way to do this than doing two loops,
      // but I want to calculate the size of the destination first.

      // for reasons I don't understand the below loop crashes chrome if it
      // goes on too long. I don't know why it's getting an OOM condition.
      // Experimentally on my machine I can get to about 120,000,000
      // but I'll restrict the user to 10,000,000

      let maxdur = 10000000;
      let dur = 0;
      let oldPosition = 0;
      for (let i = 0; oldPosition < oldDuration; i = (i + 1) % freqDuration) {
        let shiftValue = freq.valueAtSample(i);
        // at every time step we have a different idea of what the new duration
        // will be, this is the current value
        let instantaneousNewDuration = convertTimeToSamples(
          shiftValue,
          timebase
        );
        if (dur > maxdur) {
          return constructFatalError(
            `resample-to: result wavetable too long! Must be less than ${maxdur} samples.`
          );
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
        return constructFatalError(
          `resample-to: result wavetable too short (would be zero-length).`
        );
      }
      let r = constructWavetable(dur);
      let data = r.getData();

      let j = 0;
      oldPosition = 0;
      for (
        let i = 0;
        oldPosition < oldDuration;
        j++, i = (i + 1) % freqDuration
      ) {
        let v = wt.interpolatedValueAtSample(oldPosition);
        let shiftValue = freq.valueAtSample(i);
        // convert that to samples
        let instantaneousNewDuration = convertTimeToSamples(
          shiftValue,
          timebase
        );
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
    "Resamples |wt to length |freq, which changes its pitch. Timebase tag goes on |freq."
  );

  Builtin.createBuiltin(
    "resample-by",
    ["wt_", "amount#%_"],
    function $resampleBy(env, executionEnvironment) {
      let wt = env.lb("wt");
      let amt = env.lb("amount");
      if (amt == UNBOUND) {
        amt = constructInteger(1);
        sAttach(amt);
      }

      let resultDuration = 0;

      let oldDuration = wt.getDuration();

      if (!(amt.getTypeName() == "-wavetable-")) {
        let scaleFactor = amt.getTypedValue();
        if (scaleFactor == 0) {
          return constructFatalError(
            "resample-by: cannot scale to a constant value that is zero."
          );
        }
        amt = getConstantSignalFromValue(scaleFactor);
        resultDuration = oldDuration * (1 / Math.abs(scaleFactor));
      } else {
        // match the duration of the second arg.
        resultDuration = amt.getDuration();
      }
      let amtDuration = amt.getDuration();
      let maxdur = 1000000;
      if (resultDuration > maxdur) {
        return constructFatalError(
          `resample-by: result wavetable too long! Must be less than ${maxdur} samples.`
        );
      }
      // it is possible to get here: resampling by more than the wave is long
      // leaves a fraction of a sample
      // (comment by Claude)
      resultDuration = Math.round(resultDuration);
      if (resultDuration < 1) {
        return constructFatalError(
          "resample-by: that leaves less than one sample. Sorry!"
        );
      }

      let r = constructWavetable(resultDuration);
      let data = r.getData();

      let oldPosition = 0;
      for (let i = 0; i < resultDuration; i++) {
        let v = wt.interpolatedValueAtSample(oldPosition);
        let amountToAdvance = amt.valueAtSample(i % amtDuration);
        oldPosition += amountToAdvance;
        data[i] = v;
      }

      r.init();
      return r;
    },
    'Resamples |wt by |amount: 1 is no change, negative runs it backwards. A constant |amount keeps the length of |wt; a wave sets the length from |amount instead.'
  );

  Builtin.createBuiltin(
    "resample-scale",
    ["wt_", "degree#"],
    function $resampleScale(env, executionEnvironment) {
      let wt = env.lb("wt");
      let deg = env.lb("degree");
      let scaleDegree = deg.getTypedValue();

      // 24 -> 4
      // 12 -> 2
      // 0 -> 1
      // -12 -> 0.5

      // scale factor is 2 ** (degree / 12)

      let scaleFactor = 2 ** (scaleDegree / 12);

      let oldDuration = wt.getDuration();

      let resultDuration = oldDuration * (1 / Math.abs(scaleFactor));

      let maxdur = 1000000;
      if (resultDuration > maxdur) {
        return constructFatalError(
          `resample-scale: result wavetable too long! Must be less than ${maxdur} samples.`
        );
      }
      if (resultDuration <= 0) {
        // is it possible to get here?
        return constructFatalError(
          `resample-scale: result wavetable too short (would be zero-length).`
        );
      }

      let r = constructWavetable(resultDuration);
      let data = r.getData();

      let oldPosition = 0;
      for (let i = 0; i < resultDuration; i++) {
        let v = wt.interpolatedValueAtSample(oldPosition);
        let amountToAdvance = scaleFactor;
        oldPosition += amountToAdvance;
        data[i] = v;
      }

      r.init();
      return r;
    },
    "Resamples |wt by |degree scale degrees, treating |wt as the root: 3 is a minor third up, -1 a semitone down. Equal temperament."
  );

  Builtin.createBuiltin(
    "normalize",
    ["wt_"],
    function $normalize(env, executionEnvironment) {
      let wt = env.lb("wt");
      let amp = wt.getAmp();
      let gain = 1 / amp;

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
    "Scales |wt so its highest peak sits exactly at full scale."
  );

  Builtin.createBuiltin(
    "half-rectify",
    ["wt_"],
    function $halfrectify(env, executionEnvironment) {
      let wt = env.lb("wt");

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
    "Sets every negative sample of |wt to zero and leaves the rest."
  );

  Builtin.createBuiltin(
    "phase-shift",
    ["wt_", "amt#%_"],
    function $offset(env, executionEnvironment) {
      let wt = env.lb("wt");
      let amt = env.lb("amt");

      if (!(amt.getTypeName() == "-wavetable-")) {
        amt = getConstantSignalFromValue(amt.getTypedValue(), wt.getDuration());
        sAttach(amt);
      }

      let originalDur = wt.getDuration();
      let dur = Math.max(originalDur, amt.getDuration());
      let r = constructWavetable(dur);
      let data = r.getData();

      for (let i = 1; i < dur; i++) {
        let shift = amt.valueAtSample(i);
        let samplesToShift = shift * originalDur;
        let val = wt.interpolatedValueAtSample(i + samplesToShift);
        data[i] = val;
      }
      r.init();
      return r;
    },
    'Shifts |wt by |amt of its own length, which counts as one cycle whatever the shape: 1 is a whole cycle forward, -1 a whole cycle back. |amt may be a wave.'
  );

  Builtin.createBuiltin(
    "fit to",
    ["wt_", "len#%"],
    function $sizeto(env, executionEnvironment) {
      let len = env.lb("len");
      let wt = env.lb("wt");

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
    "Cuts |wt to |len, or pads it with silence to reach it. Timebase tag goes on |len."
  );

  // short enough to type mid-set, and still says what it does -- a single f
  // is a letter you would hit by accident
  // (comment by Claude)
  Builtin.aliasBuiltin("fit", "fit to");

  Builtin.createBuiltin(
    "delay",
    ["wt_", "time#%"],
    function $delay(env, executionEnvironment, commandTags) {
      let time = env.lb("time");
      let wt = env.lb("wt");

      time = convertTimeToSamples(time);
      let originalDuration = wt.getDuration();
      /*
      Anything pushed past the end has to go somewhere. By default the wave
      gets longer to make room for it, which is what you want for a sound that
      ends. Tagged wrap, the length is left alone and what falls off the end
      comes back round to the beginning, which is what you want for something
      that is going to be looped -- otherwise the tail is either cut off or the
      loop grows by the delay time every pass.
      */
      let wrap = hasCommandTag(commandTags, "wrap");
      let outputDuration = wrap ? originalDuration : originalDuration + time;

      let r = constructWavetable(outputDuration);
      let data = r.getData();

      if (wrap) {
        for (let i = 0; i < originalDuration; i++) {
          data[(i + time) % outputDuration] += wt.valueAtSample(i);
        }
      } else {
        for (let i = time; i < outputDuration; i++) {
          data[i] = wt.valueAtSample(i - time);
        }
      }
      r.init();
      return r;
    },
    "A copy of |wt moved |time later, with silence in front, longer by |time. Tag the command wrap to keep the length and bring the tail round to the start. Timebase tag goes on |time."
  );

  Builtin.createBuiltin(
    "feedback",
    ["wt_", "f&", "attenuation%", "n#"],
    function $feedback(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      let f = env.lb("f");
      // as with delay: round to the beginning rather than off the end
      let wrap = hasCommandTag(commandTags, "wrap");
      let attenuation = env.lb("attenuation").getTypedValue();
      /*
      |n is required, and it is the thing that keeps this bounded. Letting it be
      left out and running until the tail went quiet read better -- it is what a
      real feedback loop does -- but an attenuation just under one does not trip
      any guard and still takes hundreds of rounds, and since f usually makes
      the signal longer every time, the work and the memory go up with the
      square of the count. A number you have to type is a worse instrument and
      a much better fuse.
      */
      let n = env.lb("n").getTypedValue();

      let dur = wt.getDuration();
      let wtData = wt.getData();

      /*
      Summed into a buffer of its own rather than straight into the result,
      because how long the result is is not known until the rounds have been
      run. Each round is whatever f made of the one before, and f is usually
      something like a delay, so the signal gets longer every time round.

      It used to write into a result fixed at the length of |wt, which threw
      away every part of every round that landed past the end. A delay of a
      fraction of a beat fed back forty times is nothing but tail, so what came
      back was the dry sound and very little else.

      Tagged wrap the length is held at |wt and the tail comes round to the
      beginning instead, which is the same choice delay offers, and the reason
      to want it is the same: a wave that has to stay loopable.
      */
      let acc = new Float64Array(dur);
      for (let i = 0; i < dur; i++) {
        acc[i] = wtData[i];
      }

      let fedBackSignal = wt;
      for (let i = 0; i < n; i++) {
        fedBackSignal = sEval(
          systemState.getSCF().makeCommandWithClosureOneArg(f, fedBackSignal)
        );
        let fedBackData = fedBackSignal.getData();
        let len = fedBackSignal.getDuration();
        for (let j = 0; j < len; j++) {
          fedBackData[j] = fedBackData[j] * attenuation;
        }
        if (wrap) {
          for (let j = 0; j < len; j++) {
            acc[j % dur] += fedBackData[j];
          }
          continue;
        }
        if (len > acc.length) {
          let bigger = new Float64Array(len);
          bigger.set(acc);
          acc = bigger;
        }
        for (let j = 0; j < len; j++) {
          acc[j] += fedBackData[j];
        }
      }

      let output = constructWavetable(acc.length);
      let outData = output.getData();
      for (let i = 0; i < acc.length; i++) {
        outData[i] = acc[i];
      }
      output.init();
      return output;
    },
    "Calls |f on |wt, then on its own output, |n times, quieter by |attenuation each round, and sums them. Tag the command wrap to hold the length of |wt."
  );

  /*
  comb and allpass are both one delay line fed back on itself, differing only
  in what comes out of it. Doing that in a single pass is why they are builtins
  rather than delay and feedback stuck together: feedback makes n whole copies
  of the wave, while these carry one running line, so the tail is exponential
  rather than counted, and the delay can move while the wave plays. A moving
  delay is what a flanger is.

  (comment by Claude)
  */

  // per-sample delay in samples. A wave says it directly, since a wave has
  // nowhere to put a timebase tag -- build one with wave math to get a flanger.
  // (comment by Claude)
  /*
  A wave used as a length means what a number does, tag and all: the timebase is
  read off the wave once and every sample value goes through it. Before this a
  wave was always read as raw samples however it was tagged, so the same value
  named two different lengths depending on which one you handed over.

  Values are not rescaled to fit a range. A wavetable holds whatever is put in
  it, so a delay sweeping between a thousand and five thousand samples is a wave
  whose values are a thousand to five thousand -- not a sine that gets secretly
  stretched to reach them.

  (comment by Claude)
  */
  function lengthAt(nex) {
    if (nex.getTypeName() == "-wavetable-") {
      let timebase = nexToTimebase(nex);
      return function (i) {
        return convertTimeToSamples(nex.valueAtSample(i), timebase);
      };
    }
    let d = convertTimeToSamples(nex);
    return function (i) {
      return d;
    };
  }

  function longestDelay(nex) {
    if (nex.getTypeName() != "-wavetable-") {
      return convertTimeToSamples(nex);
    }
    let timebase = nexToTimebase(nex);
    let most = 1;
    for (let i = 0; i < nex.getDuration(); i++) {
      let v = convertTimeToSamples(nex.valueAtSample(i), timebase);
      if (v > most) most = v;
    }
    return Math.ceil(most);
  }


  /*
  Feedback is allowed to be a wave, the same way the delay time is. A wave in
  the range a feedback value already lives in -- roughly minus one to one -- is
  what any oscillator or envelope already produces, so unlike the delay time
  there is nothing to scale first.

  A moving feedback stops the allpass being an allpass: flat magnitude is a
  property of a system that is not changing, and this one is. That is the point
  rather than a defect -- it is how the sweep in a phaser gets its depth -- but
  it does mean the guarantee only holds while amount is a number.

  (comment by Claude)
  */
  const MAX_FEEDBACK = 0.99;
  const MAX_DELAY_SECONDS = 10;

  function clampGain(v) {
    if (v > MAX_FEEDBACK) return MAX_FEEDBACK;
    if (v < -MAX_FEEDBACK) return -MAX_FEEDBACK;
    return v;
  }

  function gainAt(nex) {
    if (nex == UNBOUND) {
      return function (i) { return 0.5; };
    }
    if (nex.getTypeName() == "-wavetable-") {
      return function (i) { return clampGain(nex.valueAtSample(i)); };
    }
    let g = clampGain(nex.getTypedValue());
    return function (i) { return g; };
  }

  // the tail is however long the loudest the feedback ever gets takes to decay
  // (comment by Claude)
  function largestGain(nex) {
    if (nex == UNBOUND) return 0.5;
    if (nex.getTypeName() != "-wavetable-") {
      return Math.abs(clampGain(nex.getTypedValue()));
    }
    let most = 0;
    for (let i = 0; i < nex.getDuration(); i++) {
      let v = Math.abs(clampGain(nex.valueAtSample(i)));
      if (v > most) most = v;
    }
    return most;
  }

  function runDelayLine(name, env, isAllpass) {
    let wt = env.lb("wt");
    let timenex = env.lb("time");
    let gnex = env.lb(isAllpass ? "amount" : "feedback");

    let maxDelay = longestDelay(timenex);
    if (!(maxDelay >= 1)) {
      return constructFatalError(name + ": delay time must be at least 1 sample. Sorry!");
    }
    // the line is allocated at the longest delay asked for, and a wave of big
    // numbers through a timebase reaches very large very quickly
    // (comment by Claude)
    if (maxDelay > MAX_DELAY_SECONDS * getSampleRate()) {
      return constructFatalError(
          name + ": delay time is longer than " + MAX_DELAY_SECONDS + " seconds. Sorry!");
    }
    let delayAtSample = lengthAt(timenex);
    let gainAtSample = gainAt(gnex);

    let dur = wt.getDuration();
    let outDur = dur + decayTailSamples(largestGain(gnex), maxDelay);
    if (outDur < 1) outDur = dur;

    let r = constructWavetable(outDur);
    let data = r.getData();
    let line = new Float64Array(maxDelay + 2);
    let write = 0;

    for (let i = 0; i < outDur; i++) {
      let at = i % dur;
      let d = delayAtSample(at);
      if (d < 1) d = 1;
      if (d > maxDelay) d = maxDelay;
      let g = gainAtSample(at);
      // read between two samples, so a delay that moves glides rather than
      // stepping from one sample to the next
      // (comment by Claude)
      let readAt = write - d;
      while (readAt < 0) readAt += line.length;
      let i0 = Math.floor(readAt);
      let frac = readAt - i0;
      let lo = line[i0 % line.length];
      let hi = line[(i0 + 1) % line.length];
      let delayed = lo + (hi - lo) * frac;

      let x = i < dur ? wt.valueAtSample(i) : 0;
      let y;
      if (isAllpass) {
        let v = x + g * delayed;
        y = delayed - g * v;
        line[write] = v;
      } else {
        y = x + g * delayed;
        line[write] = y;
      }
      write = (write + 1) % line.length;
      data[i] = y;
    }
    r.init();
    return r;
  }

  Builtin.createBuiltin(
    "comb",
    ["wt_", "time#%_", "feedback#%_?"],
    function $comb(env, executionEnvironment) {
      return runDelayLine("comb", env, false);
    },
    "Feeds |wt back into itself |time later, |feedback of it each pass, default 0.5. Negative inverts each repeat. Both may be waves; a timebase tag goes on |time."
  );

  Builtin.createBuiltin(
    "allpass",
    ["wt_", "time#%_", "amount#%_?"],
    function $allpass(env, executionEnvironment) {
      return runDelayLine("allpass", env, true);
    },
    "Delays each frequency of |wt by a different amount and leaves every amplitude alone. |amount, default 0.5, sets how far apart they end up. Both may be waves."
  );

  /*
  A bank of combs into a chain of allpasses, which is the shape every
  algorithmic reverb has had since Schroeder, with Freeverb's delay lengths and
  its damping. Eight combs at lengths that share no common factor make the
  echoes dense enough to stop being heard as echoes; the allpasses then smear
  what is left so that nothing rings at a pitch of its own.

  Convolution gets you a more faithful room than this ever will, and you have
  that already. This is for when you have no impulse response to hand, and for
  the things convolution cannot do -- a tail you can make longer or darker by
  changing a number.

  (comment by Claude)
  */
  const REVERB_COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const REVERB_ALLPASSES = [556, 441, 341, 225];
  // the lengths above were chosen at this rate, so they are scaled from it
  // (comment by Claude)
  const REVERB_TUNED_AT = 44100;
  // eight combs at that feedback multiply up, and this brings the wet signal
  // back to about the level it came in at
  // (comment by Claude)
  const REVERB_INPUT_GAIN = 0.045;

  function zeroToOne(nex, dflt) {
    if (nex == UNBOUND) return dflt;
    let v = nex.getTypedValue();
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  Builtin.createBuiltin(
    "reverb",
    ["wt_", "size#%?", "mix#%?", "damping#%?"],
    function $reverb(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      let size = zeroToOne(env.lb("size"), 0.5);
      let mix = zeroToOne(env.lb("mix"), 0.3);
      let damping = zeroToOne(env.lb("damping"), 0.5);

      let scale = getSampleRate() / REVERB_TUNED_AT;
      let combLen = [];
      let allpassLen = [];
      for (let i = 0; i < REVERB_COMBS.length; i++) {
        combLen.push(Math.max(1, Math.round(REVERB_COMBS[i] * scale)));
      }
      for (let i = 0; i < REVERB_ALLPASSES.length; i++) {
        allpassLen.push(Math.max(1, Math.round(REVERB_ALLPASSES[i] * scale)));
      }

      // size is the tail length, damping is how fast the high end of it dies
      // (comment by Claude)
      let feedback = 0.7 + 0.28 * size;
      let damp = 0.4 * damping;
      let longest = combLen[combLen.length - 1];

      let dur = wt.getDuration();
      let outDur = dur + decayTailSamples(feedback, longest);
      if (outDur < 1) outDur = dur;

      let r = constructWavetable(outDur);
      let data = r.getData();

      let combBuf = [];
      let combAt = [];
      let combStore = [];
      for (let k = 0; k < combLen.length; k++) {
        combBuf.push(new Float64Array(combLen[k]));
        combAt.push(0);
        combStore.push(0);
      }
      let apBuf = [];
      let apAt = [];
      for (let j = 0; j < allpassLen.length; j++) {
        apBuf.push(new Float64Array(allpassLen[j]));
        apAt.push(0);
      }

      {
        for (let i = 0; i < outDur; i++) {
          let dry = i < dur ? wt.valueAtSample(i) : 0;
          let input = dry * REVERB_INPUT_GAIN;

          let wet = 0;
          for (let k = 0; k < combBuf.length; k++) {
            let out = combBuf[k][combAt[k]];
            // one pole lowpass inside the loop, so each time round is duller
            // than the last -- which is what a room does
            // (comment by Claude)
            combStore[k] = out * (1 - damp) + combStore[k] * damp;
            combBuf[k][combAt[k]] = input + combStore[k] * feedback;
            combAt[k] = (combAt[k] + 1) % combBuf[k].length;
            wet += out;
          }
          for (let j = 0; j < apBuf.length; j++) {
            let bufout = apBuf[j][apAt[j]];
            apBuf[j][apAt[j]] = wet + bufout * 0.5;
            apAt[j] = (apAt[j] + 1) % apBuf[j].length;
            wet = bufout - wet;
          }

          data[i] = dry * (1 - mix) + wet * mix;
        }
      }
      r.init();
      return r;
    },
    "Reverb on |wt: |size is how big the room is, |mix how much of it you hear, |damping how fast the highs die."
  );

  /*
  Measured over a window that slides along the wave, so what comes back is a
  wave itself: how loud the sound is as it goes, rather than one number for the
  whole thing. Ask without a window and you get the one number instead, since
  that is the whole wave in a single window.

  The window is centred on the sample it reports, not trailing behind it. A
  meter has to be causal because it cannot see the future; this is reading a
  recording, where the future is right there, and centring means the measurement
  lines up with the sound that caused it. At the ends the window is simply
  shorter.

  Both are computed by sliding rather than by re-reading the window at every
  sample: a second of window on a minute of audio is otherwise billions of
  operations.
  */
  function windowedMeasure(wt, windowSamples, wantRms) {
    let dur = wt.getDuration();
    let r = constructWavetable(dur);
    let data = r.getData();
    let half = Math.floor(windowSamples / 2);

    let lo = 0;
    let hi = -1;
    let sumOfSquares = 0;
    // indices, biggest first, so the front is the loudest sample still in the
    // window -- anything smaller that arrived earlier can never be the answer
    let biggest = [];
    let front = 0;

    for (let i = 0; i < dur; i++) {
      let wantLo = Math.max(0, i - half);
      let wantHi = Math.min(dur - 1, i - half + windowSamples - 1);

      while (hi < wantHi) {
        hi++;
        let v = wt.valueAtSample(hi);
        if (wantRms) {
          sumOfSquares += v * v;
        } else {
          let a = Math.abs(v);
          while (biggest.length > front
              && Math.abs(wt.valueAtSample(biggest[biggest.length - 1])) <= a) {
            biggest.pop();
          }
          biggest.push(hi);
        }
      }
      while (lo < wantLo) {
        if (wantRms) {
          let v = wt.valueAtSample(lo);
          sumOfSquares -= v * v;
        } else if (biggest[front] == lo) {
          front++;
        }
        lo++;
      }

      if (wantRms) {
        data[i] = Math.sqrt(sumOfSquares / (hi - lo + 1));
      } else {
        data[i] = Math.abs(wt.valueAtSample(biggest[front]));
      }
    }
    r.init();
    return r;
  }

  function wholeWaveMeasure(wt, wantRms) {
    let dur = wt.getDuration();
    if (dur == 0) return constructFloat(0);
    if (!wantRms) return constructFloat(wt.getAmp());
    let sumOfSquares = 0;
    for (let i = 0; i < dur; i++) {
      let v = wt.valueAtSample(i);
      sumOfSquares += v * v;
    }
    return constructFloat(Math.sqrt(sumOfSquares / dur));
  }

  function measureBuiltin(name, wantRms, docs) {
    Builtin.createBuiltin(
      name,
      ["wt_", "window#%?"],
      function (env, executionEnvironment) {
        let wt = env.lb("wt");
        let window = env.lb("window");
        if (window == UNBOUND) {
          return wholeWaveMeasure(wt, wantRms);
        }
        let windowSamples = convertTimeToSamples(window);
        if (windowSamples < 1) {
          return constructFatalError(name + ": window is shorter than one sample. Sorry!");
        }
        return windowedMeasure(wt, windowSamples, wantRms);
      },
      docs
    );
  }

  measureBuiltin("volume", true,
      "How loud |wt is over |window, as a wave. This is rms, which follows what you hear rather than the single loudest sample: a kick and a hi-hat with the same peak are not the same volume. Leave |window out for one number covering the whole wave. Timebase tag goes on |window.");

  measureBuiltin("peak-of", false,
      "The loudest sample of |wt within |window, as a wave. Leave |window out for one number covering the whole wave. Use volume for what you hear rather than what the meter hits. Timebase tag goes on |window.");

  Builtin.createBuiltin(
    "envelope-of",
    ["wt_", "attack#%?", "release#%?"],
    function $envelopeOf(env, executionEnvironment) {
      let wt = env.lb("wt");
      let attack = env.lb("attack");
      let release = env.lb("release");

      let attackSamples = attack == UNBOUND
          ? Math.round(0.005 * getSampleRate())
          : convertTimeToSamples(attack);
      let releaseSamples = release == UNBOUND
          ? Math.round(0.05 * getSampleRate())
          : convertTimeToSamples(release);
      if (attackSamples < 0 || releaseSamples < 0) {
        return constructFatalError("envelope-of: attack and release cannot be negative. Sorry!");
      }

      /*
      Unlike volume and peak-of, this one runs forwards only and never looks
      ahead. That is not an oversight: the whole point of an envelope follower
      is that it rises and falls at different rates, and quick-to-rise
      slow-to-fall only means anything if it is moving through the sound in
      order.

      The coefficient is how much of the old value survives one sample. Over
      the given number of samples that leaves 1/e of the distance still to
      travel, which is what makes attack and release read as times rather than
      as arbitrary numbers.
      */
      let attackKeep = attackSamples < 1 ? 0 : Math.exp(-1 / attackSamples);
      let releaseKeep = releaseSamples < 1 ? 0 : Math.exp(-1 / releaseSamples);

      let dur = wt.getDuration();
      let r = constructWavetable(dur);
      let data = r.getData();
      let level = 0;
      for (let i = 0; i < dur; i++) {
        let v = Math.abs(wt.valueAtSample(i));
        let keep = v > level ? attackKeep : releaseKeep;
        level = keep * level + (1 - keep) * v;
        data[i] = level;
      }
      r.init();
      return r;
    },
    "How loud |wt is over time, as a wave. |attack and |release set how closely it follows."
  );

  Builtin.aliasBuiltin("rms", "volume");
  // what this was called when it could only measure the whole wave
  Builtin.aliasBuiltin("amplitude", "peak-of");

  Builtin.createBuiltin(
    "brightness",
    ["wt_"],
    function $brightness(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      if (wt.getDuration() < 2) {
        return constructFatalError(
            "brightness: this wave is too short to measure. Sorry!");
      }

      /*
      The centre of gravity of the spectrum, which is the one number that
      tracks what an ear calls bright. Measured frame by frame and pooled
      rather than in one go, so a loud bright moment counts for more than a
      quiet dark one, and so the answer does not depend on how long the wave
      happens to be.

      (comment by Claude)
      */
      let sampleRate = getSampleRate();
      let num = 0;
      let den = 0;
      forEachSpectrum(wt, 2048, 1024, function (mags, n) {
        for (let b = 0; b < mags.length; b++) {
          num += ((b * sampleRate) / n) * mags[b];
          den += mags[b];
        }
      });
      if (den == 0) {
        return constructFatalError("brightness: this wave is silent. Sorry!");
      }
      let hz = num / den;

      let timebase = timebaseFromTags(commandTags);
      if (!timebase || timebase == "HZ") {
        return constructFloat(hz);
      }
      if (timebase == "NOTE") {
        return constructFloat(frequencyToNoteNum(hz));
      }
      return constructFloat(convertSamplesToTimebase(timebase, sampleRate / hz));
    },
    "How bright |wt sounds, as one frequency in hz: the centre of gravity of its spectrum. Not its pitch. Tag the command with a timebase for another unit."
  );

  Builtin.aliasBuiltin("centroid-of", "brightness");

  /*
  What note a sound is.

  Both numbers, because they answer different questions. The note is what you
  want to play it back or to compare it with another sample; the frequency is
  what you want to tune to it, and the difference between them is how far out of
  tune the thing is -- which rounding to a note throws away.

  -1 for both when there is no pitch, rather than an error: a drum hit, a noise
  sweep and a silence are all things you might reasonably hand this, and a
  program asking about a hundred samples wants to carry on past the first cymbal.

  (comment by Claude)
  */
  Builtin.createBuiltin(
    "detect-pitch",
    ["wt_"],
    function $detectPitch(env, executionEnvironment) {
      let wt = env.lb("wt");
      let hz = detectPitchHz(wt.getData(), wt.getDuration(), getSampleRate());
      let note = (hz > 0) ? Math.round(frequencyToNoteNum(hz)) : -1;
      if (note < 0 || note > 127) {
        hz = -1;
        note = -1;
      }
      let r = constructOrg();
      let f = constructFloat(hz);
      f.addTag(newTagOrThrowOOM("frequency", "detect-pitch"));
      r.appendChild(f);
      let n = constructInteger(note);
      n.addTag(newTagOrThrowOOM("note", "detect-pitch"));
      r.appendChild(n);
      return r;
    },
    "The pitch of |wt, as an org of the frequency in hz and the nearest note number. Both are -1 if there is no pitch."
  );

  Builtin.createBuiltin(
    "duration",
    ["wt_"],
    function $duration(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      let samples = wt.getDuration();
      let timebase = timebaseFromTags(commandTags);
      if (!timebase || timebase == "SAMPLES") {
        return constructInteger(samples);
      }
      return constructFloat(convertSamplesToTimebase(timebase, samples));
    },
    "How long |wt is, in samples. Tag the command with a timebase for another unit."
  );

  Builtin.createBuiltin(
    "silence",
    ["len%#?"],
    function $lenation(env, executionEnvironment) {
      let len = env.lb("len");
      if (len == UNBOUND) {
        len = constructInteger(4);
        len.addTag(
          newTagOrThrowOOM("beats", "silence wavetable builtin, timebase")
        );
        sAttach(len);
      }
      let dur = convertTimeToSamples(len);
      return constructWavetable(dur);
    },
    "Silence, |len long. Timebase tag goes on |len."
  );

  Builtin.createBuiltin(
    "wrap",
    ["wt_", "len#%", "times#∅?"],
    function $wrap(env, executionEnvironment) {
      let wt = env.lb("wt");
      let dur = convertTimeToSamples(env.lb("len"));
      if (!(dur >= 1)) {
        return constructFatalError("wrap: length must be at least one sample. Sorry!");
      }

      /*
      Everything past |len comes back round to the start and is added to what
      is already there, and if what comes back is longer than |len it comes
      round again, and again -- the sample at i lands at i modulo |len however
      many times round that is.

      A wave shorter than |len is not shortened: the result is always |len
      long, so this is the thing to reach for when a sound has to fit a loop
      whether it is too long or too short.
      */
      let times = env.lb("times");
      let stopAt = wt.getDuration();
      if (times != UNBOUND) {
        let n = Math.floor(times.getTypedValue());
        if (!(n >= 0)) {
          n = 0;
        }
        // n wraps means the original plus n more times round, and anything
        // past that is dropped rather than folded in
        let limit = dur * (n + 1);
        if (limit < stopAt) {
          stopAt = limit;
        }
      }

      let r = constructWavetable(dur);
      let data = r.getData();
      for (let i = 0; i < stopAt; i++) {
        data[i % dur] += wt.valueAtSample(i);
      }
      r.init();
      return r;
    },
    "Folds |wt into a wave |len long: anything past |len comes back round to the start and is added to what is there, as many times as it takes. Give |times to stop after that many times round. The result is always |len long, so a short wave is padded rather than cut."
  );

  Builtin.createBuiltin(
    "repeat",
    ["wt_", "reps#%?"],
    function $repeat(env, executionEnvironment) {
      let wt = env.lb("wt");
      let reps = env.lb("reps");
      let wtdur = wt.getDuration();
      if (wtdur < 1) {
        return constructFatalError("repeat: there is nothing to repeat. Sorry!");
      }

      // tagged with a timebase it is the length to fill, untagged it is how
      // many times round
      // (comment by Claude)
      let dur;
      if (reps == UNBOUND) {
        dur = wtdur;
      } else if (explicitTimebase(reps)) {
        dur = convertTimeToSamples(reps);
      } else {
        dur = Math.round(wtdur * reps.getTypedValue());
      }
      if (!(dur >= 1)) {
        return constructFatalError("repeat: that is not long enough to hold anything. Sorry!");
      }
      if (dur > STRETCH_MAX_OUTPUT) {
        return constructFatalError("repeat: that would be too long to hold. Sorry!");
      }

      let r = constructWavetable(dur);
      let data = r.getData();
      for (let i = 0; i < dur; i++) {
        data[i] = wt.valueAtSample(i % wtdur);
      }
      r.init();
      return r;
    },
    "Repeats |wt |reps times. Tag |reps with a timebase and it is a length to fill instead, cut wherever the last repeat lands. Without |reps, one copy."
  );

  Builtin.createBuiltin(
    "seq",
    ["wtlst()#%_..."],
    /*
    Laid out on a timeline rather than glued end to end, which is the same
    thing when nothing overlaps and the point when something does.

    A wave goes down at the current position and the position moves on by the
    length of that wave. A number says how far the position moves instead --
    the thing before it only gets that long before the next one starts. Make it
    shorter than the wave and the next thing begins before this one has
    finished, which is how four notes that ring on for a bar each get played a
    beat apart and heard over each other. Overlaps are summed.

    A number before anything has been laid down moves the position with nothing
    under it, which is silence.

    Nesting is flattened, so a wave and its length can be written together as a
    pair and it means exactly the same as writing them next to each other. The
    flat form is the one to prefer; the pair only reads better when a list is
    being built somewhere else and handed over whole.

    A number used to become a constant signal one sample long, which was not
    useful to anybody and is what a number now means instead.
    */
    function $chain(env, executionEnvironment) {
      let wtlst = env.lb("wtlst");

      let pieces = [];
      let at = 0;
      // how far the position was moved by the last thing laid down, which is
      // what a length replaces
      let pending = 0;
      let extent = 0;

      function take(c) {
        if (c.getTypeName() == "-wavetable-") {
          pieces.push({ wave: c, at: at });
          let n = c.getDuration();
          if (at + n > extent) extent = at + n;
          at += n;
          pending = n;
          return null;
        }
        if (Utils.isInteger(c) || Utils.isFloat(c)) {
          let n = convertTimeToSamples(c);
          if (!(n >= 0)) {
            return constructFatalError(
                "seq: a length saying how long something gets before the next "
                + "one starts cannot be negative. Sorry!");
          }
          at = at - pending + n;
          pending = n;
          return null;
        }
        if (c.isNexContainer && c.isNexContainer()) {
          for (let j = 0; j < c.numChildren(); j++) {
            let e = take(c.getChildAt(j));
            if (e) return e;
          }
          return null;
        }
        return constructFatalError(
          `seq: invalid type - must be wavetable, integer, or float. Got ${c.getTypeName()}`
        );
      }

      for (let i = 0; i < wtlst.numChildren(); i++) {
        let e = take(wtlst.getChildAt(i));
        if (e) return e;
      }

      let dur = at > extent ? at : extent;
      let r = constructWavetable(dur);
      let data = r.getData();

      for (let i = 0; i < pieces.length; i++) {
        let wave = pieces[i].wave;
        let start = pieces[i].at;
        let n = wave.getDuration();
        for (let j = 0; j < n; j++) {
          data[start + j] += wave.valueAtSample(j);
        }
      }
      r.init();
      return r;
    },
    "Lays waves end to end into one wave. A number sets how long the wave before it gets, which may be shorter than it is, so parts overlap and are summed. A number before any wave is silence. Lengths take a timebase tag."
  );

  Builtin.createBuiltin(
    "load-audio",
    ["fname$"],
    function $loadAudio(env, executionEnvironment, commandTags) {
      let want = readAudioTags(commandTags);
      if (want.error) {
        return constructFatalError(`load-audio: ${want.error}`);
      }
      if (want.folders.length > 1) {
        return constructFatalError(
            `load-audio: tagged with ${want.folders.length} folders, `
            + `it can only load out of one`);
      }
      let fname = env.lb("fname").getFullTypedValue();

      /*
      A name from list-audio starts with its library -- wave/metallic/x.wav --
      so most of the time nothing else has to be said and the name alone is
      enough. A name without one falls back to the tag, and then to the default
      library, which is what makes a folder tag plus a bare filename work.
      */
      let split = splitLibraryFromPath(fname);
      if (split && want.library && split.library != want.library) {
        return constructFatalError(
            `load-audio: the name says ${split.library} and the tag says `
            + `${want.library}. Sorry!`);
      }
      let library = split ? split.library
          : (want.library ? want.library : DEFAULT_LIBRARY);
      if (split) {
        fname = split.path;
      }
      /*
      list-audio hands back folder-prefixed names, so the usual thing already
      says which folder it is in. A folder tag is for the other way round --
      map load-audio over one folder's listing, or type a bare filename -- so
      it only fills in a prefix that isn't there.
      */
      if (want.folders.length == 1 && fname.indexOf("/") == -1) {
        fname = want.folders[0] + "/" + fname;
      }
      /*
      Names in a listing carry no extension and every folder and file in the
      library is named so it can be typed after a dot. A name that came from
      somewhere else -- typed by hand, or saved in a document written before
      the library was renamed -- is put in the same shape here rather than
      simply failing to be found.
      */
      fname = withWavExtension(normalizeAudioName(fname));


      let deferredValue = constructDeferredValue();
      deferredValue.set(
        new GenericActivationFunctionGenerator("load-audio", function (
          callback,
          deferredValue
        ) {
          loadAudio(fname, library, function (sampledata) {
            let r = constructWavetable(sampledata.length);
            r.initWith(sampledata);
            callback(r);
          }, function (message) {
            callback(constructFatalError(`load-audio: ${message}`));
          });
        })
      );
      let loadingMessage = constructEError(`loading ${library} ${fname}`);
      loadingMessage.setErrorType(ERROR_TYPE_INFO);
      deferredValue.appendChild(loadingMessage);
      deferredValue.activate();
      return deferredValue;
    },
    "Loads |fname as a wavetable. |fname is a name as it appears in list-audio, which begins with the library it is in, as in wave/metallic/AKWF_0309. A .wav on the end is allowed but not needed."
  );

  Builtin.createBuiltin(
    "set-bpm",
    ["bpm#%"],
    function $setBpm(env, executionEnvironment) {
      let bpm = env.lb("bpm");
      let v = bpm.getTypedValue();
      setBpm(v);
      return constructNil();
    },
    "Sets the global bpm."
  );

  Builtin.createBuiltin(
    "milliseconds-of",
    ["len"],
    function $millisecondsOf(env, executionEnvironment) {
      let len = env.lb("len");
      let ms = (convertTimeToSamples(len) / getSampleRate()) * 1000;
      // setTimeout drops anything after the decimal point, so a float here
      // would only be rounded later, somewhere less obvious.
      // (comment by Claude)
      return constructInteger(Math.round(ms));
    },
    "|len in whole milliseconds, rounded. Takes a timebase tag, so this is how a length in beats reaches something outside the audio system."
  );

  /*
  A slice point can be tagged the way any other length can, and additionally
  with of-total, which reads it as a fraction of this particular wave: 0.5
  of-total is halfway along whatever you passed in. A tag on the list applies
  to every point in it, so you do not have to tag them one at a time.
  */
  function hasTagNamed(nex, name) {
    for (let i = 0; i < nex.numTags(); i++) {
      if (nex.getTag(i).getTagString() == name) return true;
    }
    return false;
  }

  function slicePointToSamples(point, list, total) {
    if (hasTagNamed(point, "of-total") || (list && hasTagNamed(list, "of-total"))) {
      return Math.round(point.getTypedValue() * total);
    }
    let timebase = explicitTimebase(point);
    if (!timebase && list) {
      timebase = explicitTimebase(list);
    }
    /*
    Untagged goes through the default timebase, the same as every other length
    in the system. This used to read an untagged point as a sample offset so
    that split-points-of could be fed straight back in, but a builtin where a
    plain 8 means something different than it does everywhere else is a worse
    trade than the round trip is worth. split-points-of tags what it hands back
    instead, so the round trip still works and now says what its numbers are.
    */
    return convertTimeToSamples(point, timebase);
  }

  Builtin.createBuiltin(
    "set-split-points",
    ["wt_", "points#%()"],
    function $sliceAt(env, executionEnvironment) {
      let wt = env.lb("wt");
      let points = env.lb("points");
      let total = wt.getDuration();

      let list = Utils.isNexContainer(points) ? points : null;
      let each = list ? [] : [points];
      for (let i = 0; list && i < list.numChildren(); i++) {
        each.push(list.getChildAt(i));
      }

      let marks = [];
      for (let i = 0; i < each.length; i++) {
        let at = slicePointToSamples(each[i], list, total);
        // the same range the editor enforces: a slice at either end would make
        // an empty section
        if (!(at >= 1 && at <= total - 1)) {
          // both numbers, because a tagged point converts to something the
          // caller never typed and reporting only that reads as nonsense
          // (comment by Claude)
          return constructFatalError("set-split-points: " + each[i].getTypedValue()
              + " is sample " + at + ", which is not inside this "
              + total + " sample wave. Sorry!");
        }
        marks.push(at);
      }

      let r = wt.makeCopy();
      for (let i = 0; i < marks.length; i++) {
        if (r.markers.indexOf(marks[i]) == -1) {
          r.markers.push(marks[i]);
        }
      }
      r.markers.sort(function(a, b) { return a - b; });
      r.cacheSections();
      return r;
    },
    "A copy of |wt with split points at |points, one number or a list; n points give n+1 slices. Tag them with a timebase, or with of-total for a fraction of the wave. A tag on the list applies to every point."
  );

  Builtin.createBuiltin(
    "split-points-of",
    ["wt_"],
    function $splitPointsOf(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      let total = wt.getDuration();
      let ofTotal = false;
      for (let i = 0; commandTags && i < commandTags.length; i++) {
        if (commandTags[i].getTagString() == "of-total") ofTotal = true;
      }
      let timebase = timebaseFromTags(commandTags);
      let r = constructOrg();
      for (let i = 0; i < wt.markers.length; i++) {
        let at = wt.markers[i];
        if (ofTotal) {
          r.appendChild(constructFloat(total == 0 ? 0 : at / total));
        } else if (!timebase || timebase == "SAMPLES") {
          // tagged, because set-split-points reads an untagged number as the
          // default timebase -- an untagged sample offset would come back in
          // as that many beats
          let n = constructInteger(at);
          n.addTag(newTagOrThrowOOM("samps", "split-points-of, sample offset"));
          r.appendChild(n);
        } else {
          r.appendChild(constructFloat(convertSamplesToTimebase(timebase, at)));
        }
      }
      return r;
    },
    "The split points of |wt, as sample offsets tagged samps, ready for set-split-points. Tag the command with a timebase for another unit, or of-total for a fraction of the wave."
  );

  /*
  The whole transform, handed over rather than kept inside the one builtin that
  needed it. brightness is one thing you can do with a spectrum; there are many
  others, and which of them are worth having is not a question this file should
  be answering on anyone's behalf.

  Magnitude and phase rather than real and imaginary, because magnitude is what
  nearly every use of this wants and phase is what the rest want -- and the two
  together lose nothing, so an inverse can be built on top of this later without
  changing what it gives back.

  One spectrum for the whole wave, zero filled up to the next power of two. Not
  a spectrogram: a wave is already the thing you slide a window along, so
  whoever wants frames can cut them with split and call this on each.

  Tag the command <hann> to window the wave first. Worth doing for anything that
  is not already a whole number of cycles -- without it the join between the end
  of the wave and the start of the next imaginary repeat is a step, and a step
  smears across every bin.
  */
  Builtin.createBuiltin(
    "fft",
    ["wt_"],
    function $fft(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      let dur = wt.getDuration();
      if (dur < 1) {
        return constructFatalError("fft: there is nothing in this wave. Sorry!");
      }
      let n = nextPowerOfTwo(dur);
      let re = new Float64Array(n);
      let im = new Float64Array(n);
      let window = hasCommandTag(commandTags, "hann") ? hannWindow(dur) : null;
      for (let i = 0; i < n; i++) {
        let v = i < dur ? wt.valueAtSample(i) : 0;
        re[i] = window && i < dur ? v * window[i] : v;
        im[i] = 0;
      }
      fft(re, im);

      // the second half of the spectrum mirrors the first, so it says nothing
      // the first half has not already said
      let bins = n / 2 + 1;
      let magnitude = constructWavetable(bins);
      let phase = constructWavetable(bins);
      let md = magnitude.getData();
      let pd = phase.getData();
      for (let b = 0; b < bins; b++) {
        md[b] = Math.sqrt(re[b] * re[b] + im[b] * im[b]);
        pd[b] = Math.atan2(im[b], re[b]);
      }
      magnitude.init();
      phase.init();
      magnitude.addTag(newTagOrThrowOOM("magnitude", "fft builtin"));
      phase.addTag(newTagOrThrowOOM("phase", "fft builtin"));

      let r = constructOrg();
      r.appendChild(magnitude);
      r.appendChild(phase);
      return r;
    },
    "The spectrum of |wt, as an org of two waves tagged magnitude and phase, reached with dots as in @spectrum.magnitude. One value per bin, at |wt zero filled to the next power of two. Tag the command hann to window first."
  );

  /*
  Shapes a sound the way a mouth does. Which vowel comes from a tag on the
  command, the same way a filter's type does, because it is which filter this is
  rather than a number you would sweep.

  Anything with harmonics to shape works; a buzzy waveform works best, which is
  what a voice is starting from. Silence and sine waves have nothing at the
  formant frequencies for it to bring out.
  */
  Builtin.createBuiltin(
    "formant",
    ["wt_", "strength#%?"],
    function $formant(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      let strength = env.lb("strength");
      let vowels = vowelNames();

      let vowel = null;
      for (let i = 0; commandTags && i < commandTags.length; i++) {
        let t = commandTags[i].getTagString().trim().toLowerCase();
        if (vowels.indexOf(t) == -1) continue;
        if (vowel && vowel != t) {
          return constructFatalError(
              "formant: tag the command with one vowel, not two. Sorry!");
        }
        vowel = t;
      }
      if (!vowel) vowel = vowels[0];

      let amount = strength == UNBOUND ? 1 : strength.getTypedValue();
      if (!(amount > 0)) {
        return constructFatalError("formant: strength must be more than zero. Sorry!");
      }
      if (wt.getDuration() == 0) {
        return constructFatalError("formant: there is nothing in this wave. Sorry!");
      }
      return applyFormants(wt, vowel, amount, getSampleRate());
    },
    "Shapes |wt into a vowel. Tag the command a, e, i, o or u; a by default. |strength narrows the formants, default 1."
  );

  /*
  Granular synthesis works on grains rather than on samples, and this is the
  cutting-up half of it: hand it a wave and get back the grains, as waves, to do
  what you like with. Reverse them, shuffle them, drop every other one, stretch
  the gaps, play them back in a different order -- none of which this has an
  opinion about.

  An org rather than a single wave, because grains are a collection and the
  point is to treat them individually. seq puts them back together.
  */
  Builtin.createBuiltin(
    "grains-of",
    ["wt_", "size#%?", "hop#%?"],
    function $grainsOf(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      let size = env.lb("size");
      let hop = env.lb("hop");

      // 50 milliseconds is around where a grain stops being heard as a click
      // and starts being heard as a sound with a pitch
      let sizeSamples = size == UNBOUND
          ? Math.round(0.05 * getSampleRate())
          : convertTimeToSamples(size);
      // half a grain, so each one is covered twice and a windowed set sums
      // back to roughly what went in
      let hopSamples = hop == UNBOUND
          ? Math.max(1, Math.round(sizeSamples / 2))
          : convertTimeToSamples(hop);

      if (sizeSamples < 1) {
        return constructFatalError("grains-of: a grain must be at least one sample. Sorry!");
      }
      if (hopSamples < 1) {
        return constructFatalError("grains-of: hop must be at least one sample. Sorry!");
      }
      if (sizeSamples > wt.getDuration()) {
        return constructFatalError("grains-of: the grain is longer than the wave. Sorry!");
      }

      let grains = cutIntoGrains(wt, sizeSamples, hopSamples,
          hasCommandTag(commandTags, "hann"));
      let r = constructOrg();
      for (let i = 0; i < grains.length; i++) {
        r.appendChild(grains[i]);
      }
      return r;
    },
    "Cuts |wt into grains, as an org of waves. |size is how long each one is, default 50ms; |hop is how far along the next starts, default half of |size, so less overlaps and more leaves gaps. Both take a timebase tag. Tag the command hann to fade each grain in and out."
  );

  /*
  Splitting a wave anywhere but a zero crossing leaves a step at the join, and a
  step is a click. So the split points get moved to the nearest place the wave
  passes through zero, which is the place a cut is inaudible.

  A crossing is the first sample of a new polarity, which is the sample to cut
  on: a copy starting there starts from roughly nothing. A run of zeros is not a
  change of sign by itself, so silence in the middle of a wave does not read as
  two crossings.

  Two split points can land on the same crossing, and then there is one split
  point where there were two. That is the honest answer rather than a problem to
  solve: they were close enough together to want the same cut, and keeping both
  would mean keeping one of them off a crossing, which is what this is for.

  A wave with no crossings at all -- silence, or something that never leaves one
  side of zero -- is handed back as it came. There is nowhere better to put its
  split points than where they already are.
  */
  Builtin.createBuiltin(
    "snap-split-points",
    ["wt_"],
    function $snapSplitPoints(env, executionEnvironment) {
      let wt = env.lb("wt");
      let r = wt.makeCopy();
      if (r.markers.length == 0) return r;

      let total = r.getDuration();
      let crossings = [];
      let lastSign = 0;
      for (let i = 0; i < total; i++) {
        let v = r.valueAtSample(i);
        let sign = v > 0 ? 1 : (v < 0 ? -1 : 0);
        if (sign == 0) continue;
        if (lastSign != 0 && sign != lastSign) {
          crossings.push(i);
        }
        lastSign = sign;
      }
      if (crossings.length == 0) return r;

      /*
      Crossings come out in order and the markers are already sorted, so this
      walks forward across both rather than starting the search over for every
      marker -- otherwise a wave with a lot of splits in it is every marker
      against every crossing.
      */
      let moved = [];
      let at = 0;
      for (let m = 0; m < r.markers.length; m++) {
        let mark = r.markers[m];
        while (at + 1 < crossings.length && crossings[at + 1] <= mark) {
          at++;
        }
        let best = crossings[at];
        if (at + 1 < crossings.length
            && Math.abs(crossings[at + 1] - mark) < Math.abs(mark - best)) {
          best = crossings[at + 1];
        }
        // two that snapped to the same crossing are one split point now
        if (moved.length == 0 || moved[moved.length - 1] != best) {
          moved.push(best);
        }
      }

      r.markers = moved;
      r.cacheSections();
      return r;
    },
    "A copy of |wt with every split point moved to the nearest zero crossing, where a cut does not click. Two that land on the same crossing become one. A wave with no crossings is unchanged."
  );

  Builtin.createBuiltin(
    "get-bpm",
    [],
    function $getBpm(env, executionEnvironment) {
      return constructFloat(getBpm());
    },
    "The global bpm."
  );
}

export { createWavetableBuiltins };
