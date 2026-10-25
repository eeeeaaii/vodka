# Vodka

## Introduction

Vodka is a programming language and environment for [creative coding](https://en.wikipedia.org/wiki/Creative_coding).

## Features

Vodka is currently at [version 0.4.2](CHANGES.md). 

Programming language features:

- quasi-visual programming language and runtime
- lisp-based functional paradigm
- powerful and flexible asynchronous programming model
- tagging (code annotations)
- type safety via contracts
- templating and instantiation
- saving and loading files
- control structures, logic primitives, math operations

Creative coding features:

- wavetable synthesis
- midi support
- rich text support
- animations and transition support
- fonts, styles, and formatting
- animatable parametric fonts


For updates, you can subscribe to [the vodka-announce email group](https://groups.google.com/g/vodka-announce). If you have questions or want to chat with other people using vodka, you can join [the user group](https://groups.google.com/g/vodka-users).

## Trying it out

You can play around with Vodka right now by going to [vodka.church](http://vodka.church).

## Installing

If you install Vodka locally, you can make changes or use your own audio samples. To do that:

1. Clone this repo.
2. In a terminal, run `npm install`.
3. Run `./run.sh` from the top of the repo. This builds the client and starts the server.
4. In a browser, navigate to `http://localhost:3000`

If you want the session sharing links to point at your own machine rather than at
vodka.church, also create a file `server/webenv.txt` containing the single word `local`.

### Your sessions

Running locally, every session is a folder in `server/namedsessions/`. Opening
`http://localhost:3000` with no session in the address takes you to `default-local`,
which is always there. The Sessions tab in the help menu lists your sessions with
how much space each one uses, and lets you make, rename, duplicate, export and
delete them. When you're in `default-local`, "save this session as..." moves what
you're working on into a session with a name and leaves the default empty for the
next sketch.

`server/namedsessions/` is gitignored, so it can be a git repo of your own. To keep
your sessions in version control:

```
cd server
git clone https://github.com/<you>/<your-sessions-repo>.git namedsessions
```

Then commit and push from inside `server/namedsessions/` like any other repo.
Pulling Vodka never touches it. If you'd rather keep your sessions somewhere else
on disk, set `VODKA_SESSIONS_DIR` to that folder before running `./run.sh`.

### Samples and the standard library

Two read-only sessions ship with Vodka: `samples` (in `server/samples/`) and
`packages`, the standard library (in `server/packages/`). Sample names end in
`-sample` and library names end in `-functions`. When you load a name that isn't
in your session, Vodka looks for it in samples if it ends in `-sample` and in the
standard library otherwise. So you can load a sample or a library file from any
session, change it, and save it, and from then on your session uses your copy.
Saving a `-sample` or `-functions` name shows a warning so you know you're
hiding the shipped file.

`load` and `list-files` can also read from another session:

```
~(_list-files_)                      the files in this session
~(_list-files @samples_)             the files in another session
~(_load @poems-sample_)              from your session, or from samples
~(_load @my-other-session @riff_)    from another session; saving still goes here
```

### Editing the standard library

On a local server you can edit the library directly by navigating to
`http://localhost:3000/?sessionId=packages`. Saves then go straight to
`server/packages/`, so you can edit library files in place without moving anything
afterwards. The same works for `?sessionId=samples`.

This works on a local server only. On a public one the library stays readable but
not writable.

## Documentation

In-app documentation is available by clicking on the help button. If you can't get to the documentation, add "help=me" to your browser query string.

## Interested in Contributing?

The current information about contributing is slightly out of date, but you can find it in the [Contributing How-To](./GUIDETOCONTRIBUTING.md). If you want to talk about contributing, [join the vodka-contributors email group](https://groups.google.com/g/vodka-contributors). 

## License

All code is open source licensed under the Greater GPLv3.
