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
import {
  loadSample,
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
} from "../wavetablefunctions.js";
import { forEachSpectrum } from "../fft.js";
import { loopPlay, abortPlayback, endLoops, clipStartedPlaying, togglePauseLoops, loopsArePlaying } from "../webaudio.js";
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
    "Looks at the tags on |a and sets the default timebase based on their values."
  );

  Builtin.createBuiltin(
    "get-default-timebase",
    [],
    function $getDefaultTimebase(env, executionEnvironment) {
      let tb = getDefaultTimebase();
      return constructEString(tb);
    },
    "Returns the default timebase."
  );

  Builtin.createBuiltin(
    "toggle-playback",
    ["clip"],
    function $togglePlayback(env, executionEnvironment) {
      let clip = env.lb("clip");
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
    "Silences |clip if it is playing and starts it again if it is not. A silenced clip keeps its place in the cycle, so it comes back in time with everything else."
  );

  Builtin.createBuiltin(
    "is-playing",
    ["clip"],
    function $isPlaying(env, executionEnvironment) {
      let clip = env.lb("clip");
      if (!Utils.isClip(clip)) {
        return constructFatalError("is-playing: not a clip. Sorry!");
      }
      return constructBool(loopsArePlaying(clip.getIds()));
    },
    "True if |clip is making sound: still in the cycle, and not silenced by toggle-playback."
  );

  Builtin.createBuiltin(
    "play",
    ["wt_", "channelsorclip?"],
    function $loopPlay(env, executionEnvironment) {
      let wt = env.lb("wt");

      let buffers = [];
      if (Utils.isNexContainer(wt)) {
        for (let i = 0; i < wt.numChildren(); i++) {
          buffers.push(wt.getChildAt(i).getCachedBuffer());
        }
      } else {
        buffers.push(wt.getCachedBuffer());
      }

      // Channels or a clip, never both: a replacement stays on the channels
      // the clip is already playing on, so there is nothing for channels to say.
      let arg = env.lb("channelsorclip");

      let channelnumbers = [0, 1];
      let clip = null;

      if (arg != UNBOUND && Utils.isClip(arg)) {
        if (arg.getKind() != "audio loop") {
          return constructFatalError("play: that is not an audio clip. Sorry!");
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

      let ids = loopPlay(buffers, channelnumbers);
      let what =
          "channel" + (channelnumbers.length == 1 ? " " : "s ") + channelnumbers.join(", ");
      if (clip) {
        clip.setIds(ids, what);
      } else {
        clip = constructClip("audio loop", what, ids, endLoops, channelnumbers);
      }
      // the audio system owns it while it plays, and how long that lasts is
      // decided by whether anything else owns it too
      clipStartedPlaying(clip, ids);
      return clip;
    },
    "Starts playing wt| at the next measure start, and returns a clip naming it. It plays for as long as something holds that clip: keep the clip and it loops, throw it away and it plays once, delete it and it stops at the end of the pass it is in. |channelsorclip is either the channels to play on, or a clip returned by an earlier play -- given a clip, the loop it names is replaced at the next measure start, staying on the channels it is already on, and you get the same clip back. If it is not provided, the sound is played on the first 2 channels. If it and/or |wt are lists, Vodka will do its best to match up sounds with channels."
  );

  // what it was called before it could do both
  Builtin.aliasBuiltin("loop-play", "play");

  Builtin.createBuiltin(
    "start-recording",
    ["_wt_", "channel#?"],
    function $startRecording(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      let channel = env.lb("channel");
      // 1-based to the user, the way audio hardware numbers channels
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
    "Tells |wt to record from |channel (or channel 1 if |channel is not given). A wavetable holds one channel, so a stereo input is recorded one side at a time. Recording stops after 30 seconds unless this command is tagged `unlimited`."
  );

  Builtin.createBuiltin(
    "stop-recording",
    ["_wt_"],
    function $startRecording(env, executionEnvironment) {
      let wt = env.lb("wt");
      stopRecordingAudio(wt);
      return wt;
    },
    "Tells |wt to stop recording."
  );

  Builtin.createBuiltin(
    "abort-playback",
    ["channel#?"],
    function $abortPlayback(env, executionEnvironment) {
      let channel = env.lb("channel");
      let channelnumber = -1;
      if (channel != UNBOUND) {
        channelnumber = channel.getTypedValue();
      }

      abortPlayback(channelnumber);
      return constructNil();
    },
    "Starts playing the sound at the next measure start"
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
    "Splits a wavetable into smaller sections based on markers added in wavetable editor"
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
    "Turns wt| into an org holding one float for every sample. A second of audio is tens of thousands of samples, so this is meant for short waves."
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
    "Turns |samples, an org of numbers, into a wavetable one sample long for each of them. The reverse of wave-to-samples."
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
    "Passes every sample of wt| through |shape and returns the result. |shape is a wave read as a lookup rather than as a sound: its length stands for an input of -1 to 1, and the value it holds at each point is what comes out. A straight line leaves wt| alone. See wavefold-shape, soft-clip-shape and compress-shape for shapes to pass in, or make your own."
  );

  // reflect back off the limit, as many times as it takes
  function foldInto(v) {
    while (v > 1 || v < -1) {
      if (v > 1) v = 1 - (v - 1);
      if (v < -1) v = -1 + -(v + 1);
    }
    return v;
  }

  Builtin.createBuiltin(
    "wavefold-shape",
    ["folds#%?"],
    function $wavefoldShape(env, executionEnvironment) {
      let folds = env.lb("folds");
      folds = folds == UNBOUND ? 2 : folds.getTypedValue();
      if (folds < 1) {
        return constructFatalError("wavefold-shape: folds must be at least 1. Sorry!");
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
    "A shape for waveshape that folds: anything heading past the limit turns back on itself instead of flattening, which is what gives folding its sound. |folds is how many times it turns back across the full range, 2 by default. 1 is a straight line and does nothing."
  );

  Builtin.createBuiltin(
    "soft-clip-shape",
    ["amount%?"],
    function $softClipShape(env, executionEnvironment) {
      let amount = env.lb("amount");
      amount = amount == UNBOUND ? 3 : amount.getTypedValue();
      if (amount <= 0) {
        return constructFatalError("soft-clip-shape: amount must be more than 0. Sorry!");
      }
      // scaled so that the shape still reaches the limit at the limit, rather
      // than everything simply getting quieter as you turn it up
      let full = Math.tanh(amount);
      return constructShape(function (x) {
        return Math.tanh(amount * x) / full;
      });
    },
    "A shape for waveshape that rounds off rather than chopping flat: the signal bends over gradually as it approaches the limit, the way tape and tubes do, instead of hitting a wall. |amount is how hard it bends, 3 by default; small numbers are nearly a straight line."
  );

  Builtin.createBuiltin(
    "compress-shape",
    ["threshold%?", "ratio%?"],
    function $compressShape(env, executionEnvironment) {
      let threshold = env.lb("threshold");
      let ratio = env.lb("ratio");
      threshold = threshold == UNBOUND ? 0.5 : threshold.getTypedValue();
      ratio = ratio == UNBOUND ? 4 : ratio.getTypedValue();
      if (threshold <= 0 || threshold >= 1) {
        return constructFatalError("compress-shape: threshold must be between 0 and 1. Sorry!");
      }
      if (ratio < 1) {
        return constructFatalError("compress-shape: ratio must be at least 1. Sorry!");
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
    "A shape for waveshape that pushes loud parts down and brings the rest up to meet them. Anything above |threshold is squashed by |ratio, and the whole thing is scaled so the limit is still the limit. Defaults are a threshold of 0.5 and a ratio of 4. Note this is the curve of a compressor and not the timing: it has no attack or release, so it acts on each sample by itself."
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
    "Reverses wavetable |wt"
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
    "Returns a wavetable containing the constant value |val. Length is given by |len. Timebase tag (nn, secs, hz, b, samps) is on |len."
  );

  Builtin.createBuiltin(
    "singlepole",
    ["wt1_", "wt2#%_", "type$?"],
    function $singlepole(env, executionEnvironment) {
      let wt1 = env.lb("wt1");
      let wt2 = env.lb("wt2");
      let kind = filterKind(env.lb("type"), ["low", "high"]);
      if (!kind) {
        return constructFatalError(
            "singlepole: type must be low or high. Sorry!");
      }

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
      let yk = wt1.valueAtSample(0);

      let cutoffAtOne = 20000;
      let timeconstant = 1 / getSampleRate();

      for (let i = 0; i < dur; i++) {
        let wt1val = wt1.valueAtSample(i);
        let wt2val = wt2.valueAtSample(i);
        let cutoff = wt2val * cutoffAtOne;
        let tau = 1 / cutoff;
        let alpha = timeconstant / tau;
        yk += alpha * (wt1val - yk);
        // one pole highpass is just whatever the lowpass did not keep
        data[i] = kind == "high" ? wt1val - yk : yk;
      }
      r.init();
      return r;
    },
    "Runs |wt1 through a single pole filter with a cutoff determined by |wt2. If an integer or float is passed in for wt2, it is converted to a constant signal. A value of 1 corresponds to a filter cutoff frequency of 20kHz. |type is low or high, and defaults to low. One pole cannot resonate -- use doublepole for that."
  );

  /*
  A cutoff can be a wave so that it can be swept, and a wave has nowhere to put
  a timebase tag, so it keeps the scale singlepole has always used: 1 means
  20kHz. A plain number means the same thing. A number that carries a timebase
  tag means what it says, so %2000 hz is two thousand hertz.
  */
  const CUTOFF_AT_ONE = 20000;

  function explicitTimebase(nex) {
    for (let i = 0; i < nex.numTags(); i++) {
      let t = timebaseForTagString(nex.getTag(i).getTagString());
      if (t) return t;
    }
    return null;
  }

  function frequencyAt(nex) {
    if (nex.getTypeName() == "-wavetable-") {
      return function (i) {
        return nex.valueAtSample(i) * CUTOFF_AT_ONE;
      };
    }
    let hz;
    if (explicitTimebase(nex)) {
      let samples = convertTimeToSamples(nex);
      hz = samples > 0 ? getSampleRate() / samples : 0;
    } else {
      hz = nex.getTypedValue() * CUTOFF_AT_ONE;
    }
    return function (i) {
      return hz;
    };
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

  function filterKind(nex, allowed) {
    if (nex == UNBOUND) return allowed[0];
    let s = nex.getFullTypedValue().trim().toLowerCase();
    if (s.endsWith("pass")) s = s.substring(0, s.length - 4);
    return allowed.indexOf(s) == -1 ? null : s;
  }

  /*
  Resonance runs 0 to 1 rather than being a Q, because 0 to 1 is what a knob
  does. It has to live inside the filter's own loop -- feeding a filter back
  into itself from outside cannot get you here.
  */
  function resonanceToQ(r) {
    if (r < 0) r = 0;
    if (r > 1) r = 1;
    return 0.707 / (1 - 0.98 * r);
  }

  // the usual cookbook biquad, written into a reused array so a swept cutoff
  // does not allocate once per sample
  function biquadInto(c, kind, hz, q, gainDb, sampleRate) {
    let nyquist = sampleRate / 2;
    if (hz < 1) hz = 1;
    if (hz > nyquist * 0.99) hz = nyquist * 0.99;
    if (q < 0.01) q = 0.01;
    let w0 = (2 * Math.PI * hz) / sampleRate;
    let cosw = Math.cos(w0);
    let sinw = Math.sin(w0);
    let alpha = sinw / (2 * q);
    // half of gainDb, because a peak or a shelf gets it on the way in and
    // again on the way out
    let A = Math.pow(10, gainDb / 40);
    let sqrtA2 = 2 * Math.sqrt(A) * alpha;
    let a0, a1, a2, b0, b1, b2;
    a0 = 1 + alpha;
    a1 = -2 * cosw;
    a2 = 1 - alpha;
    switch (kind) {
      case "low":
        b0 = (1 - cosw) / 2;
        b1 = 1 - cosw;
        b2 = (1 - cosw) / 2;
        break;
      case "high":
        b0 = (1 + cosw) / 2;
        b1 = -(1 + cosw);
        b2 = (1 + cosw) / 2;
        break;
      case "band":
        b0 = alpha;
        b1 = 0;
        b2 = -alpha;
        break;
      case "notch":
        b0 = 1;
        b1 = -2 * cosw;
        b2 = 1;
        break;
      case "peak":
        b0 = 1 + alpha * A;
        b1 = -2 * cosw;
        b2 = 1 - alpha * A;
        a0 = 1 + alpha / A;
        a1 = -2 * cosw;
        a2 = 1 - alpha / A;
        break;
      case "lowshelf":
        b0 = A * (A + 1 - (A - 1) * cosw + sqrtA2);
        b1 = 2 * A * (A - 1 - (A + 1) * cosw);
        b2 = A * (A + 1 - (A - 1) * cosw - sqrtA2);
        a0 = A + 1 + (A - 1) * cosw + sqrtA2;
        a1 = -2 * (A - 1 + (A + 1) * cosw);
        a2 = A + 1 + (A - 1) * cosw - sqrtA2;
        break;
      case "highshelf":
        b0 = A * (A + 1 + (A - 1) * cosw + sqrtA2);
        b1 = -2 * A * (A - 1 + (A + 1) * cosw);
        b2 = A * (A + 1 + (A - 1) * cosw - sqrtA2);
        a0 = A + 1 - (A - 1) * cosw + sqrtA2;
        a1 = 2 * (A - 1 - (A + 1) * cosw);
        a2 = A + 1 - (A - 1) * cosw - sqrtA2;
        break;
    }
    c[0] = b0 / a0;
    c[1] = b1 / a0;
    c[2] = b2 / a0;
    c[3] = a1 / a0;
    c[4] = a2 / a0;
  }

  Builtin.createBuiltin(
    "doublepole",
    ["wt_", "cutoff#%_", "type$?", "resonance#%_?"],
    function $doublepole(env, executionEnvironment) {
      let wt = env.lb("wt");
      let kind = filterKind(env.lb("type"), ["low", "high", "band", "notch"]);
      if (!kind) {
        return constructFatalError(
            "doublepole: type must be low, high, band or notch. Sorry!");
      }
      let cutoff = frequencyAt(env.lb("cutoff"));
      let resonance = amountAt(env.lb("resonance"), 0);

      let dur = wt.getDuration();
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
    "Runs wt| through a two pole filter. |type is low, high, band or notch, and defaults to low. |cutoff is a fraction of 20kHz, so 0.05 is 1kHz, or a number tagged with a timebase (hz, nn) to name a real frequency. |resonance runs 0 to 1 and is what makes a sweep sound like a filter rather than a tone control -- it lives inside the filter's loop, which is why you cannot get it by feeding a filter back into itself. Both |cutoff and |resonance can be waves, so both can move while the sound plays."
  );

  Builtin.createBuiltin(
    "param-eq",
    ["wt_", "freq#%_", "gain#%_", "q#%_?", "type$?"],
    function $paramEq(env, executionEnvironment) {
      let wt = env.lb("wt");
      let kind = filterKind(env.lb("type"), ["peak", "lowshelf", "highshelf"]);
      if (!kind) {
        return constructFatalError(
            "param-eq: type must be peak, lowshelf or highshelf. Sorry!");
      }
      let freq = frequencyAt(env.lb("freq"));
      let gain = amountAt(env.lb("gain"), 0);
      let q = amountAt(env.lb("q"), 1);

      /*
      One band per call. Chaining calls is how you get a whole eq, and it
      reads better than pairing up parallel lists of frequencies and gains.
      Unlike a filter this leaves everything outside the band alone, which is
      what makes it the thing you reach for when a sound is nearly right.
      */
      let dur = wt.getDuration();
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
    "One band of parametric eq on wt|: lifts or drops a region around |freq by |gain decibels and leaves the rest alone. |q is how wide that region is, higher being narrower, and defaults to 1. |type is peak, lowshelf or highshelf, and defaults to peak -- a shelf moves everything below or above |freq instead of a band around it. |freq is a fraction of 20kHz, so 0.05 is 1kHz, or a number tagged with a timebase (hz, nn). Chain calls to build up a whole eq. All three of |freq, |gain and |q can be waves, so a band can move."
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
    "Convolves |wt with |ir. If |ir is an impulse response, this should give a reverb effect. Otherwise this will create a hybrid sound that shares some characteristics of both sounds. Warning: this function is very slow, you may have to wait a while."
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
    "Slows down rate of change of |wt1 to a maximum value per sample given by |wt2. If wt1 is a signal residing between -1 and 1, values of wt2 that are between 0 and 1 will yield best results."
  );

  // fix this, example situation where it breaks:
  // take a normal ramp (2 beats) and pass it through a function that takes the value to the 5th power
  // the function will return, but some async bullshit will continue and some numbers will keep incrementing in the js console, not sure what is happening

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
    "Returns a wavetable of white noise. Length is given by |len. Timebase tag (nn, secs, hz, b, samps) is on |len."
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
    "Returns a wavetable containing one cycle of a sine wave. Length is given by |nn. Timebase tag (nn, secs, hz, b, samps) is on |nn."
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
    "Returns a wavetable containing a gate signal. Length is given by |nn. Timebase tag (nn, secs, hz, b, samps) is on |nn."
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
    "Returns a wavetable containing one cycle of a square wave. Length is given by |nn. Timebase tag (nn, secs, hz, b, samps) is on |nn."
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
    "Returns a wavetable containing one cycle of a triangle wave, built from its partials so that it does not alias, and running from -1 to 1. Length is given by |nn. Timebase tag (nn, secs, hz, b, samps) is on |nn."
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
    "Returns a wavetable containing one cycle of a saw wave, built from its partials so that it does not alias, and running from -1 to 1. For the ideal straight-line version use ramp. Length is given by |nn. Timebase tag (nn, secs, hz, b, samps) is on |nn."
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
    "Returns a wavetable ramping from one to zero. Length is given by |len. Timebase tag (nn, secs, hz, b, samps) is on |len."
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
    "Resamples the audio to a given duration or frequency (for example, changing a sample from 2 seconds to 4 seconds). Timebase tag (nn, secs, hz, b, samps) is on |freq."
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
      if (resultDuration <= 0) {
        // is it possible to get here?
        return constructFatalError(
          `resample-by: result wavetable too short (would be zero-length).`
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
    'Resamples the audio by a percentage given by the second arg. Positive 1 means no change. Negative values cause the "play head" to reverse direction. If the second argument is a constant, the duration of the result is determined by the first argument, otherwise the duration of the second argument determines the result duration.'
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
    "Assumes the given sample is the fundamental in a diatonic scale and resamples to a scale degree determined by the second integer argument (e.e. 3 is a minor third up, -1 is a half step down). Note that this uses equal temperament."
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
    "Normalizes a wavetable (attenuates it such that the highest peak is exactly at full scale, or 1)"
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
    "Changes all negative signal values in |wt to zero, but leaves positive values alone."
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
    'phase shifts the signal by |amt. The length of |wt is considered to be one "cycle" (even if it is a complex waveform). The values for |amt should range from 1.0 (full cycle shift forward) to -1.0 (full cycle shift backward). A wavetable can be passed in for |amt.'
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
    "Clips the length of the wavetable, or pads the end of it with silence, depending on whether the passed-in length is greater or less than the length of the wavetable. Timebase tag (nn, secs, hz, b, samps) is on |len."
  );

  // short enough to type mid-set
  Builtin.aliasBuiltin("f", "fit to");

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
    "Outputs a delayed copy of |wt, the beginning padded with silence and the wave made longer by |time to fit the tail. Tag the command with wrap to keep the original length instead and let the tail come back round to the beginning, which is what you want for a wave you are going to loop. Combine with feedback to get a classic delay sound. Timebase tag (nn, secs, hz, b, samps) is on |time."
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
      let n = env.lb("n").getTypedValue();

      let dur = wt.getDuration();
      let wtData = wt.getData();
      let output = constructWavetable(dur);
      let outData = output.getData();

      for (let i = 0; i < dur; i++) {
        outData[i] = wtData[i];
      }

      let fedBackSignal = wt;
      for (let i = 0; i < n; i++) {
        fedBackSignal = sEval(
          systemState.getSCF().makeCommandWithClosureOneArg(f, fedBackSignal)
        );
        let fedBackData = fedBackSignal.getData();
        for (let j = 0; j < fedBackSignal.getDuration(); j++) {
          fedBackData[j] = fedBackData[j] * attenuation;
        }
        if (wrap) {
          for (let j = 0; j < fedBackSignal.getDuration(); j++) {
            outData[j % dur] += fedBackData[j];
          }
        } else {
          for (let j = 0; j < dur; j++) {
            if (j < fedBackSignal.getDuration()) {
              outData[j] += fedBackData[j];
            }
          }
        }
      }

      output.init();
      return output;
    },
    "Calls the function |f on |wt to produce an output, then calls |f on that output, then calls |f on the output of that, and so on, |n times, attenuating the output by |attenuation each time before passing it back into |f. The output of this function is the sum of all the outputs. This mimics analog feedback, but note that the |n parameter is a hard limit on the number of times the function is fed back into itself. Tag the command with wrap to have anything that runs past the end come back round to the beginning rather than being cut off, which is what you want for a wave you are going to loop."
  );

  /*
  comb and allpass are both one delay line fed back on itself, differing only
  in what comes out of it. Doing that in a single pass is why they are builtins
  rather than delay and feedback stuck together: feedback makes n whole copies
  of the wave, while these carry one running line, so the tail is exponential
  rather than counted, and the delay can move while the wave plays. A moving
  delay is what a flanger is.
  */

  // per-sample delay in samples. A wave says it directly, since a wave has
  // nowhere to put a timebase tag -- build one with wave math to get a flanger.
  function delayAt(nex) {
    if (nex.getTypeName() == "-wavetable-") {
      return function (i) {
        return nex.valueAtSample(i);
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
    let most = 1;
    for (let i = 0; i < nex.getDuration(); i++) {
      let v = nex.valueAtSample(i);
      if (v > most) most = v;
    }
    return Math.ceil(most);
  }

  // how long the tail takes to fall to -60dB, capped so a feedback close to 1
  // cannot ask for a wave that never ends
  function decayTailSamples(g, delaySamples) {
    let a = Math.abs(g);
    if (a < 0.0001) return 0;
    let repeats = Math.ceil(Math.log(0.001) / Math.log(a));
    return Math.min(repeats * delaySamples, Math.round(10 * getSampleRate()));
  }

  /*
  Wrapped, the answer wanted is what you would hear if the wave had been
  looping forever, so the line is run over the wave a few times to charge it
  and only the last pass is kept. Each pass leaves the line at g^(dur/delay) of
  where it was, which is what says how many passes are enough.
  */
  function chargePasses(g, delaySamples, dur) {
    let a = Math.abs(g);
    if (a < 0.0001 || delaySamples < 1) return 1;
    let perPass = Math.pow(a, dur / delaySamples);
    if (perPass < 0.001) return 2;
    return Math.min(1 + Math.ceil(Math.log(0.001) / Math.log(perPass)), 256);
  }

  function runDelayLine(name, env, commandTags, isAllpass) {
    let wt = env.lb("wt");
    let timenex = env.lb("time");
    let gnex = env.lb(isAllpass ? "amount" : "feedback");

    let maxDelay = longestDelay(timenex);
    if (!(maxDelay >= 1)) {
      return constructFatalError(name + ": delay time must be at least 1 sample. Sorry!");
    }
    let g = gnex == UNBOUND ? 0.5 : gnex.getTypedValue();
    if (g > 0.99) g = 0.99;
    if (g < -0.99) g = -0.99;
    let delayAtSample = delayAt(timenex);

    let dur = wt.getDuration();
    let wrap = hasCommandTag(commandTags, "wrap");
    let outDur = wrap ? dur : dur + decayTailSamples(g, maxDelay);
    if (outDur < 1) outDur = dur;

    let r = constructWavetable(outDur);
    let data = r.getData();
    let line = new Float64Array(maxDelay + 2);
    let write = 0;
    let passes = wrap ? chargePasses(g, maxDelay, dur) : 1;
    // the pass count is an upper bound; a line that has settled is done
    let previous = passes > 1 ? new Float64Array(outDur) : null;

    for (let p = 0; p < passes; p++) {
      for (let i = 0; i < outDur; i++) {
        let d = delayAtSample(i % dur);
        if (d < 1) d = 1;
        if (d > maxDelay) d = maxDelay;
        // read between two samples, so a delay that moves glides rather than
        // stepping from one sample to the next
        let at = write - d;
        while (at < 0) at += line.length;
        let i0 = Math.floor(at);
        let frac = at - i0;
        let a = line[i0 % line.length];
        let b = line[(i0 + 1) % line.length];
        let delayed = a + (b - a) * frac;

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
      if (!previous) break;
      let worst = 0;
      if (p > 0) {
        for (let i = 0; i < outDur; i++) {
          let diff = Math.abs(data[i] - previous[i]);
          if (diff > worst) worst = diff;
        }
        if (worst < 0.00001) break;
      }
      previous.set(data);
    }
    r.init();
    return r;
  }

  Builtin.createBuiltin(
    "comb",
    ["wt_", "time#%_", "feedback#%?"],
    function $comb(env, executionEnvironment, commandTags) {
      return runDelayLine("comb", env, commandTags, false);
    },
    "Adds wt| to a copy of itself |time later, over and over, each copy quieter than the last by |feedback (0 to 1, default 0.5). Short times ring at one pitch, long ones are an echo. |time can be a wave rather than a number, and a delay that moves is a flanger -- a wave here is read as a number of samples directly, since a wave has nowhere to put a timebase tag. Tag the command with wrap to keep the original length and have the tail come round to the beginning, which for a wave you are going to loop sounds like it has been looping all along; without it the wave gets longer to make room for the tail. Timebase tag (nn, secs, hz, b, samps) is on |time."
  );

  Builtin.createBuiltin(
    "allpass",
    ["wt_", "time#%_", "amount#%?"],
    function $allpass(env, executionEnvironment, commandTags) {
      return runDelayLine("allpass", env, commandTags, true);
    },
    "Delays some frequencies more than others while leaving every one of them at the same level, so on its own it sounds like nothing. That is what it is for: chains of these are how a reverb turns a handful of echoes into something that sounds like a room, and one against the dry sound is a phaser. |amount is 0 to 1, default 0.5. Takes the same |time and the same wrap tag as comb."
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
      "How loud wt| is over |window, as a wave you can look at or multiply by. This is rms, which follows what you hear rather than what the single loudest sample happens to be -- a kick and a hi-hat with the same peak are nowhere near the same volume. Leave |window out to get one number for the whole wave. Timebase tag (nn, secs, hz, b, samps) is on |window.");

  measureBuiltin("peak-of", false,
      "The loudest sample in wt| within |window, as a wave. Leave |window out to get one number for the whole wave, which is what amplitude has always done. Use volume instead if you want what you hear rather than what the meter hits. Timebase tag (nn, secs, hz, b, samps) is on |window.");

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
    "Follows how loud wt| is as it goes, rising over |attack and falling over |release, and returns that as a wave. This is the shape of the sound rather than the sound: multiply another wave by it and that wave takes on this one's dynamics. Rising fast and falling slow is what makes it read as an envelope rather than as a rectified copy -- the defaults are 5 milliseconds and 50. Timebase tag (nn, secs, hz, b, samps) is on |attack and |release."
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
    "How bright wt| sounds, as one frequency in hz: the centre of gravity of its spectrum. Useful for sorting a pile of samples dark to bright, or for picking the dullest hit out of a folder. It says nothing about pitch -- a bright bass note reads higher than a dull high one. Tag the command with a timebase (nn, secs, hz, b, samps) to get the answer in that instead."
  );

  Builtin.aliasBuiltin("centroid-of", "brightness");

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
    "How long wt| is, in samples. Tag the command with a timebase (nn, secs, hz, b, samps) to get it in that instead."
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
    "Creates an empty wavetable (silence) with a duration of the requested number of samples. Timebase tag (nn, secs, hz, b, samps) is on |len."
  );

  Builtin.createBuiltin(
    "repeat",
    ["wt_", "reps#?"],
    function $repeat(env, executionEnvironment) {
      let wt = env.lb("wt");
      let times = 1;
      if (times != UNBOUND) {
        times = env.lb("reps").getTypedValue();
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
    "Repeats (loops) a sample a number of times exactly equal to |reps."
  );

  Builtin.createBuiltin(
    "seq",
    ["wtlst()#%_..."],
    function $chain(env, executionEnvironment) {
      let wtlst = env.lb("wtlst");

      let waves = [];
      for (let i = 0; i < wtlst.numChildren(); i++) {
        let c = wtlst.getChildAt(i);
        if (c.getTypeName() == "-wavetable-") {
          waves.push(c);
        } else if (c.isNexContainer()) {
          for (let j = 0; j < c.numChildren(); j++) {
            let c2 = c.getChildAt(j);
            if (c2.getTypeName() == "-wavetable-") {
              waves.push(c2);
            } else {
              waves.push(getConstantSignalFromValue(c2.getTypedValue()));
            }
          }
        } else if (Utils.isInteger(c) || Utils.isFloat(c)) {
          waves.push(getConstantSignalFromValue(c.getTypedValue()));
        } else {
          return constructFatalError(
            `seq: invalid type - must be wavetable, integer, or float. Got ${c.getTypeName()}`
          );
        }
      }

      let dur = 0;
      for (let i = 0; i < waves.length; i++) {
        let c = waves[i];
        dur += c.getDuration();
      }

      let r = constructWavetable(dur);
      let data = r.getData();

      let k = 0;
      for (let i = 0; i < waves.length; i++) {
        let c = waves[i];
        for (let j = 0; j < c.getDuration(); j++, k++) {
          data[k] = c.valueAtSample(j);
        }
      }
      r.init();
      return r;
    },
    "Sequences a list of wavetables into a single wavetable by concatenating them. If a list is passed in, the list must contain integers, floats, or wavetables only."
  );

  Builtin.createBuiltin(
    "load-sample",
    ["fname$"],
    function $loadSample(env, executionEnvironment) {
      let fname = env.lb("fname").getFullTypedValue();

      let deferredValue = constructDeferredValue();
      deferredValue.set(
        new GenericActivationFunctionGenerator("load-sample", function (
          callback,
          deferredValue
        ) {
          loadSample(fname, function (sampledata) {
            let r = constructWavetable(sampledata.length);
            r.initWith(sampledata);
            callback(r);
          });
        })
      );
      let loadingMessage = constructEError(`loading sample`);
      loadingMessage.setErrorType(ERROR_TYPE_INFO);
      deferredValue.appendChild(loadingMessage);
      deferredValue.activate();
      return deferredValue;

      // let r = constructWavetable();
      // r.loadFromFile(fname);
      // return r;
    },
    "Loads a sample file from disk."
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
    "Sets the global BPM used in time calculations."
  );

  Builtin.createBuiltin(
    "milliseconds-of",
    ["len"],
    function $millisecondsOf(env, executionEnvironment) {
      let len = env.lb("len");
      let ms = (convertTimeToSamples(len) / getSampleRate()) * 1000;
      // setTimeout drops anything after the decimal point, so a float here
      // would only be rounded later, somewhere less obvious.
      return constructInteger(Math.round(ms));
    },
    "Returns the length of |len in whole milliseconds, rounded. |len takes a timebase tag like any other length, so this is how a length in beats becomes a number that something outside the audio system can use."
  );

  /*
  A slice point can be tagged the way any other length can, and additionally
  with of-total, which reads it as a fraction of this particular wave: 0.5
  of-total is halfway along whatever you passed in. A tag on the list applies
  to every point in it, so you do not have to tag them one at a time.
  */
  function hasCommandTag(commandTags, name) {
    for (let i = 0; commandTags && i < commandTags.length; i++) {
      if (commandTags[i].getTagString() == name) return true;
    }
    return false;
  }

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
    let timebase = null;
    if (point.numTags() > 0) {
      timebase = nexToTimebase(point);
    } else if (list && list.numTags() > 0) {
      timebase = nexToTimebase(list);
    }
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
          return constructFatalError(
              "set-split-points: split point " + at + " is not inside the wave. Sorry!");
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
    "Returns a copy of wt| with split points at |points, the same ones you get by pressing v while editing a wave. |points is one number or a list of them, and n of them give n+1 slices. They are lengths, so they can be tagged with a timebase, and additionally with of-total to read them as a fraction of this wave -- 0.5 of-total is halfway along. A tag on the list applies to every point in it."
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
          r.appendChild(constructInteger(at));
        } else {
          r.appendChild(constructFloat(convertSamplesToTimebase(timebase, at)));
        }
      }
      return r;
    },
    "The split points in wt|, as an org of sample offsets. Tag the command with a timebase (nn, secs, hz, b, samps) to get them in that, or with of-total to get each one as a fraction of the whole wave."
  );

  Builtin.createBuiltin(
    "find-nearest-zero-crossing",
    ["wt_", "at#%"],
    function $findNearestZeroCrossing(env, executionEnvironment, commandTags) {
      let wt = env.lb("wt");
      let total = wt.getDuration();
      if (total < 2) {
        return constructFatalError(
            "find-nearest-zero-crossing: this wave is too short to have one. Sorry!");
      }
      let from = slicePointToSamples(env.lb("at"), null, total);
      if (from < 0) from = 0;
      if (from > total - 1) from = total - 1;

      /*
      A crossing is reported at the first sample of the new polarity, which is
      the sample you want to cut on: a copy starting there starts from roughly
      nothing. A run of zeros is not a sign change by itself, so silence in the
      middle of a wave gives one crossing rather than two.
      */
      let best = -1;
      let bestDist = 0;
      let lastSign = 0;
      for (let i = 0; i < total; i++) {
        let v = wt.valueAtSample(i);
        let sign = v > 0 ? 1 : (v < 0 ? -1 : 0);
        if (sign == 0) continue;
        if (lastSign != 0 && sign != lastSign) {
          let dist = Math.abs(i - from);
          if (best == -1 || dist < bestDist) {
            best = i;
            bestDist = dist;
          }
          // everything after this one is farther away than this one
          if (i >= from) break;
        }
        lastSign = sign;
      }
      if (best == -1) {
        return constructFatalError(
            "find-nearest-zero-crossing: this wave never crosses zero. Sorry!");
      }

      if (hasCommandTag(commandTags, "of-total")) {
        return constructFloat(best / total);
      }
      let timebase = timebaseFromTags(commandTags);
      if (!timebase || timebase == "SAMPLES") {
        return constructInteger(best);
      }
      return constructFloat(convertSamplesToTimebase(timebase, best));
    },
    "The point in wt| nearest to |at where the wave changes sign. Cutting or looping there instead of at |at is what keeps a splice from clicking. |at is a length, so it can be tagged with a timebase (nn, secs, hz, b, samps) or with of-total to read it as a fraction of this wave. The answer comes back in samples unless you tag the command with a timebase or with of-total."
  );

  Builtin.createBuiltin(
    "get-bpm",
    [],
    function $getBpm(env, executionEnvironment) {
      return constructFloat(getBpm());
    },
    "Returns the global BPM used in time calculations."
  );
}

export { createWavetableBuiltins };
