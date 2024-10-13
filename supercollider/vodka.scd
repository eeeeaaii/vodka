s.boot;
s.dumpOSC(1)

(
SynthDef(\bufplayer, { | out = 0, bufnum = 0 |
	var numchannels = 2;
	var rate = 1.0;
	var trigger = 1.0;
	var startPos = 0.0;
	var loop = 1.0;
	Out.ar(out,
		PlayBuf.ar(
			numchannels,
			bufnum, rate, trigger,
			startPos, loop)
	)
}).add;
)

(
x = Synth.new("bufplayer");
)


b = Buffer.alloc(s, 256, 1)

s.quit


