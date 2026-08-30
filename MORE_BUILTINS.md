## Analysis

The point of this doc is to track decisions/thoughts/ideas about existing and potential builtins. This could get big so doing it here instead of in github issues.

# rms-of
what's the point? what do you need this for?

[claude] Fair challenge, and I think rms-of and peak-of are the weakest things I
suggested. The honest use is auto-gain: normalize already does peak-based
levelling, so peak-of adds little. rms-of differs in that it tracks *perceived*
loudness rather than the single loudest spike, so two samples matched by rms sit
at the same apparent level while two matched by peak often do not -- a kick and a
hi-hat with the same peak sound wildly different. That matters if you are
levelling a folder of samples against each other. If you are not doing that, skip
both.

[js] let's name the builtin "volume" then since that's what it measures, and have
an alias of 'rms'. But it should not return a single value, since it calculates over
a window, you can generate a wave that gives you the rms as it changes over the course
of a wave. We can make the window configurable and/or make it do the whole wave.

# average
Would it make sense to have a builtin that just computes the average of some set of values?
Not sure if yes or no.

# peak-of
again what do you need this for?

[claude] Covered above -- normalize already does what peak-of would be for. The
one thing it buys you that normalize does not is *asking without changing*: "is
this clipping" or "is this basically silence" as a condition in code. That only
becomes useful once you are generating waves programmatically and want to branch
on the result. Low priority.

[js] I see, so code something like calling peak-of and if it's > some number, do something.
Again, it should be windowed like RMS above so you can see a graph of the peak over
time.

# amplitude
this is the same as an envelope follower, isn't it? what's the difference? Could alias it to envelope-of.

[claude] You are right that they are the same idea, and I was wrong to list
envelope-of as if it were new. The difference is only smoothing: an envelope
follower has an attack and release time, so it rounds off rather than following
every sample. Your amplitude is the zero-smoothing case. I would add attack and
release as optional arguments to amplitude rather than adding a second builtin,
and alias envelope-of to it if that name reads better to you. Worth noting slew
already does the smoothing half, so amplitude + slew may already be your envelope
follower.

[js] makes sense.

# zero-crossings
what would you use it for?

[claude] Weakest of the lot for what you are doing -- drop it. It is a cheap
pitch detector for monophonic material and a rough noisiness measure (noise
crosses zero far more often than a sine), but both are things you would want
properly or not at all, and properly means fft.

[js] agree, drop it, however I think a useful and related function might be
something like "find-nearest-zero-crossing"

# centroid-of
same question, what for?

[claude] One real use: sorting or picking samples by brightness. If you have a
folder of hits and want "the darkest one" or want to arrange them dark to bright,
centroid is the one number that tracks what your ear calls brightness, and it is
much cheaper than an fft. It is a librarian's tool rather than a sound design
tool. If your sample handling is by ear and by hand, skip it.

[js] interesting, can we just call it brightness and alias to centroid-of?

# convolve
The reason I implemented this is basically for reverb. If you have an impulse response you can use this to add fairly realistic reverb. Since vodka doesn't do realtime generation of sounds and everything is a precomputed wavetable, this gets you better results than any algorithm would give you - at least this was my thinking, but maybe I'm wrong.

[claude] Your thinking is right, and it is right for a reason that is specific
to vodka: convolution reverb costs the same no matter how complex the impulse,
and since you are not generating in real time you never pay the price that makes
algorithmic reverb attractive elsewhere. Algorithmic reverbs exist mostly because
convolution was too expensive to run live. You do not have that constraint.

Two things convolution cannot do, which is the only argument for having both:
it cannot change over time (no reverb that opens up as it decays, no modulated
tail), and it cannot go beyond the length of the impulse you have. If you never
want either, convolve is genuinely enough.

[js] good points. Maybe we can start with a basic reverb.

# fft-of / inverse-fft
I can see how this would be helpful, but have to think about what it would return. Ideally all data is stored in waves, even if it's not sound. So bucket intensities could be a wave I guess.

[claude] Storing bin intensities as a wave is the right instinct and it works,
but there is a catch worth deciding on up front: an fft gives magnitude *and*
phase, and if you throw phase away you cannot invert it -- you get the sound of a
phase vocoder guessing, which is the smeary "spectral" sound. So either

  - fft-of returns two waves, magnitude and phase, and inverse-fft takes both.
    Honest, invertible, slightly awkward.
  - fft-of returns magnitude only and is analysis-only, with no inverse. Simpler,
    and enough for filtering and for looking at a sound.

There is also a windowing decision: one fft of the whole wave tells you what
frequencies are present overall but nothing about when. What you actually want
for spectral effects is a series of overlapping ffts, which means an org of waves
rather than a wave. That is the real design question, and it is the same question
granulate raises.

[js] hmm, would it be better to return an org full of waves where each wave represents a bin and the wave
shows you a windowed view of how that bin changes over time? What is more useful, more bins or higher windowing
resolution? With regard to phase, how expensive is it? Because we could just have two functions,
fft-of and fft-phase-of, so you call the second one if you want it to be invertable.

# filters
number of poles is orthogonal to whether it's lowpass, highpass, bandpass, etc. I do know that I need more filters but I was thinking of going for the model where you have a builtin that just determines whether it is single or double (or triple?) pole, and then you pass an arg telling it what *type* of filter (low, high, bandpass, notch).

Do I need an allpass filter? Again something I have never figured out how to use correctly.

I guess comb is separate?

is there currently a resonance control or would I need to feed the filter back into itself to get that?

[claude] Your model is better than mine and matches how filters are actually
built -- a filter is a topology with a type, not a separate thing per
combination. singlepole taking a type argument, plus a two-pole version, covers
nearly everything. Two poles is the useful step up; beyond that is a specialist
tool.

Resonance: no, you do not have it now, and no, feeding back into itself will not
get you there cleanly. Resonance is feedback *inside* the filter, one sample at a
time, so it has to live in the filter's own loop. It is the parameter that makes
a filter sweep sound like a filter sweep rather than a tone control -- I would
put it above the extra poles in priority.

Allpass: it passes every frequency at full level and only shifts phase, which
sounds like nothing on its own. That is exactly why you have not found a use for
it: alone it is inaudible. It is a building block -- chains of allpasses are how
algorithmic reverbs and phasers are made. Since you are doing reverb by
convolution, you probably do not need it.

Comb: yes, separate. It is a delay fed back on itself, so it is closer to your
delay and feedback builtins than to your filters, and with the wrap tag those now
compose into one. It might already exist in your toolkit without a new builtin.

[js] I think we should add resonance as native to the builtin, and I now remember
about allpass. I think we should have a separate allpass builtin since it's used
for different purposes than the other filter types, as you say. We need comb in order
to implement flanging, right? Should it be a builtin?

# time-stretch
yes I definitely want this, doesn't this require granular synthesis to do it?

[claude] Yes, essentially. The straightforward way to change length without
changing pitch is to cut the sound into grains and overlap them at a different
spacing -- so time-stretch is granulate with the grain positions moving at a
different rate than the output. Build granulate and time-stretch is a short
function on top of it. The alternative is a phase vocoder, which needs the fft
work above and has its own smeary character.

[js] ok great.

# pitch-shift
I also definitely want this, does this also require granular synthesis?

[claude] Same machinery, and it is worth seeing why: pitch-shift is
time-stretch followed by resampling. Stretch to twice the length, play back twice
as fast, and you get the original length at half the pitch. So resample-by plus
time-stretch already gives you pitch-shift for free -- you may not need a builtin
at all, just a function.

[js] eh, it will be easier if there's just a function for it.

# granulate
Yeah this would be great

[claude] Then this is the one to build first. It is the foundation for
time-stretch and pitch-shift, it is the most expressive thing on the list on its
own, and it does not depend on any of the fft work.

The design question is what it returns: one wave with the grains already mixed,
or an org of grains you place yourself. The org is more vodka-ish and composes
with everything you just added, but it is a lot of nexes for a dense cloud. My
instinct is one wave, with the grain parameters -- size, spacing, jitter,
position, and a position that can itself be a wave so the playhead can wander --
and a separate builtin later if you want the grains individually.

[js] I think returning it as one wave just creates a situation where you have to
keep adding more and more features to the builtin as people ask for things.
What if it returned an org full of short waves, one for each grain? Yes it's
potentially a lot of memory but in practice users would not actually view
all the grains, they would instead call it in a function that then does something
with the grains. I don't know enough about grains to know what metadata should
exist. Is this a case for the WASM engine we discussed earlier?

# reverb
see note above under convolve. I don't know what shroeder-reverb is and I don't know whether I should have this. Maybe these algorithmic reverbs are commoon enough that people are used to the sound and want to hear them

[claude] Schroeder reverb is the 1962 recipe that nearly every algorithmic
reverb descends from: a handful of comb filters in parallel into a couple of
allpasses. It is worth knowing the name mostly because it explains what those
building blocks are for.

On whether you should have one: the case is not quality, it is that the sound is
familiar. Plate and spring and cheap-digital reverbs are *characters* people
recognise, and an impulse response of a real space cannot give you a shimmering
80s digital tail. But you can sample those too -- impulse responses of famous
reverb units are easy to find. Given that, I would say your convolution approach
covers it and an algorithmic reverb is a nice-to-have.

[js] eh let's implement it and just call it reverb, make it simple for users.

# waveshape
Can you help me understand how this is a generalization of wavefolding? What's the difference?

[claude] Best shown as: wavefold is one shape, waveshape is any shape.

Distortion of this kind is a lookup. Take the input sample as a position along a
curve, read the height of the curve there, and that is the output. The curve is
the "transfer function". If the curve is a straight diagonal line, nothing
changes. Bend the top of the line flat and you get soft clipping. Make it a zigzag
that reverses every time it hits the top and you get exactly wavefolding.

So wavefold is waveshape with a triangular curve baked in. If waveshape takes the
curve as a *wave*, then every distortion you can imagine is one wave you can draw,
generate, or record -- and you can build the curve using the wave math you just
got. That is why I think it is the highest-value item on the whole list for a
system like yours: it turns a category of builtins into one builtin plus your
existing tools.

[js] I may in fact have implemented waveshaping and called it wavefolding -- take a look
at the code and let's rename if so.

# bitcrush / sample-reduce
Great ideas

[claude] Both are one-liners with what you now have, which is an argument for
building them and an argument for not bothering.

  bitcrush: wfloor the signal scaled up, then scale it back down
  sample-reduce: hold each sample for n samples, which is resample-by down then
                 back up with no interpolation

The second one depends on whether resample-by interpolates. If it does, you
cannot get the aliased crunch out of it and sample-reduce is worth having.

# soft-clip
No idea what this is actually

[claude] Clipping with rounded shoulders. When a signal goes past the maximum,
hard clipping chops it flat, which adds harsh high harmonics -- the sound of
digital overload. Soft clipping bends it over gradually instead, so it compresses
as it approaches the limit rather than hitting a wall, which is what analogue
circuits do and why overdriven tape and tubes sound warm rather than nasty.

It is one curve, so if you build waveshape you get it for free and should not
have it as a builtin.

[js] okay

# trianglewave and pulsewave
Yeah I guess, although someone can make it out of ramp it's still probably a nice to have, something more inexperienced people will reach for, not realizing they can derive it. Also for triangle I could do what I did for squarewave and create a more hardware-realistic one out of composing partials.

[claude] Agreed on triangle, and the partials version is the more interesting
one -- a real triangle from partials has the slightly soft top that an ideal one
does not.

Pulsewave I would now skip: w< on a ramp gives you any duty cycle in one
expression, and it teaches the thing you would want someone to learn. If it turns
out you reach for it constantly, alias it rather than implement it.

[js] is our existing saw built from partials? If we are going to give people triangle out of partials we should do it
with saw too. All of them could be built out of ramp if they want the non-partial version.

# impulse
why?

[claude] One sample at full scale and silence after. The reason is convolve: an
impulse is the identity for convolution, so convolving anything with it gives you
back exactly what you put in. That makes it the thing you use to *measure* -- run
an impulse through a chain of your own builtins and what comes out is that
chain's impulse response, which you can then use with convolve to apply the whole
chain in one step.

It is also how you capture a real space with a speaker and a microphone. Whether
you want it depends entirely on whether you want to build up impulse responses
yourself, given you are relying on convolution for reverb. Trivial to make out of
samples-to-wave now, so probably not a builtin.

[js] yeah I'm not sure this is something we need

# phasor
isn't this already what ramp does?

[claude] Yes -- looking at it again, ramp is phasor and I should have checked
before suggesting it. The only difference in Max and Pd is that phasor is
specified by frequency and runs forever while ramp is specified by length, and
your timebase tags already let you say either. Withdrawn.

[js] okay let's make it an alias for max/msp and pd users.