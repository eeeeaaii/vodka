# Vodka

## Introduction

Vodka is a [creative coding](https://en.wikipedia.org/wiki/Creative_coding) environment for creative writers.

## Features

Current features:

- programming language and runtime
- word processor combined with code editor
- some animations and transition support
- fonts, styles, and formatting that can be controlled with code
- limited 2D graphics support
- parametric fonts

Planned features include:

- a11y support
- VR/AR integration
- full 2D graphics support
- sound synthesis
- 3D/OpenGL graphics support
- a dictionary API (word definitions, parts of speech)
- support for languages and scripts other than US English
- support for RTL languages
- support for advanced font features (e.g. non-linear and broken baselines)
- debugger with step execution of code
- user input from devices other than a keyboard

For updates, you can subscribe to [the vodka-announce email group](https://groups.google.com/g/vodka-announce). If you have questions or
want to chat with other people using vodka, you can join [the user group](https://groups.google.com/g/vodka-users).

## Installing

Using Vodka requires that you start a webserver on your local machine, and then direct your browser to a local URL. Do a git pull, and then in a terminal, run:

	cd server
	./runserver.sh

This should start up a local server. Open up a browser, and in the address bar, type `localhost:3000`. You should see a completely empty web page. This is a blank Vodka doc.

## Getting Started

Please see [Getting Started with Vodka](./GETTINGSTARTED.md) for a gentle introduction that doesn't assume a whole lot of programming experience.

## Interested in Contributing?

Information about 
contributing can be found in the [Contributing How-To](./GUIDETOCONTRIBUTING.md). I am actively looking for contributors! Feel free to send me a pull request. If you want to chat about it first, [join the vodka-contributors email group](https://groups.google.com/g/vodka-contributors) and ping me there. 

## License

All code is open source licensed under the Greater GPLv3.
