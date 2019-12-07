# Vodka

## Introduction

Vodka is an integrated, Lisp-based programming environment for creative coding and livecoding. Probably the best way to think about it is that it's a visual REPL. You actively write code in the user interface of the program itself, execute that code, and then you can copy and paste it around on the screen as you see fit.

To write a program in Vodka, you manage a tree of data objects, all of which are Lisp S-Expressions, and which can be passed as data to functions. In addition to traditonal data types such as symbols, integers, and strings, Vodka has special data types that represent different "media objects" you might want to work with.

These media objects are meant to, as closely as possible, actually *be* the things, as opposed to *talking about* the things. So instead of looking at code and seeing something like

	var image = new Image("nyan cat");
	crop(image, 50, 50);

The objective is for you to be looking at the code and seeing something a little bit like this:

```(crop ```![Nyan Cat](./nyan.png)``` 50 50)```

By allowing you to directly manipulate media objects, Vodka seeks to provide an immediate and direct environment for doing creative work with code, where you can be in a mental space of muscle memory and intuition rather than one of analysis and problem-solving. When you're programming with Vodka, I want you to be "in the moment," as opposed to being several levels of signifier and indirection away from what you're doing.

The current implementation of Vodka is focused on text-based art (i.e. graphic design and text layout), and runs in the browser. However, more media objects will be added in future versions, and integrated in the same visual REPL, so that your code could operate simultaneously on, for example, images or sounds.

## Installing

Using Vodka requires that you start a server on your local machine, and then direct your browser to that local URL. Do a git pull, and then run:

	cd server
	./startserver.sh

This should start up a server at ``localhost:3000``. You will see a blank canvas.

## Getting Started

The best way to get started is probably just to start typing things and experimenting. I won't give a comprehensive tutorial, but here are a few basic concepts. 

### Exploded vs. Normal mode

Typing "escape" will toggle between Exploded and Normal mode. Exploded mode shows you in depth all the code and objects that exist in your current tree. Normal mode is "display" mode, your actual artwork. All code is invisible when you're in Normal mode -- the only data objects that are visible are media objects.

### The Selected Object

At any given time, there is only one object selected in Vodka. There is no multiselect, and probably never will be. The selected object will be more clearly visible in exploded mode, but if you select letters in Normal mode, you will see a brief flash of a cursor. To operate on multiple items at a time, they have to be inside some kind of container object or list that is selected.

Adding new objects when an object is selected doesn't replace the selected object. The concept of an "insertion point" is avoided (though used in some places -- I'm still trying to get rid of it). When you add new objects, they are (usually) appended after the selected object.

The standard copy and paste commands work as you would expect: Cmd-X, Cmd-C, and Cmd-V.

### Navigating Around

You can move around with the arrow keys (but they might do different things depending on what's selected, see "Key Funnels", below). Generally, tab should go "in" (i.e. deeper into a nested set of lists) and shift-tab should come back "out" (back up to the parent node of the whole doc tree). Clicking also works to change the selected object, but there is no drag and drop.

### Key Funnels

When you type on the keyboard, different things may happen depending on what the selected object is. Each type of object has all keyboard input "funneled" to it when it is selected. Depending on what it is, the (hopefully) intuitive thing will happen.

The default key funnel is a "word processor" (text based) key funnel. To try it out, just open up Vodka and start typing. If you hit Escape to go into Exploded mode, you'll see that lines and words are automatically added for you. The "word processor" key funnel is interpreting your keystrokes and doing the right thing for what you are currently doing.

### Writing Actual Code

Regardless of what key funnel is currently in operation, there are certain keys that are permanently mapped to certain functions. These are along the top row of your keyboard:

| Key | Creates |
| --- | ------ |
|  ~  | a command (an unquoted list that can be executed) |
| !   | a boolean |
| @   | a symbol |
| #   | an integer |
| $   | a string |
| %   | a float |
| ^   | an instance of the 'nil' data type |
| &   | a lambda |

Once an object of that type is created, its own keyfunnel will dictate what keystrokes do while it is selected (for example, strings allow you to edit the contents of the string by typing "shift-enter", while a commands will execute if you type that).

## Implementation

Vodka is implemented in very plain vanilla JavaScript. It is essentially a prototype and I'm developing it rapidly, so it's not production-ready or secure. There is a facility for recording keystrokes and user actions, and then saving them out to a file to be played back in a test. The test framework uses headless chrome to automate the tests, and the "handlebars" markup framework to generate the test output file, so you'll have to npm those in if you want to run tests or create them. To actually run the server, you just need Node itself, nothing else.

## RTTYMBT (Responses To Things You Might Be Thinking)

### It's broken! It's weird! It didn't do what you said it would!

I am very actively working on this software. It is not finished. It is pre-alpha, preverbal, and prehistoric. It is broken. Do not expect it to work well. Do, however, let me know if you find bugs or if you have questions, and especially get in touch with me if you are interested in helping. I have a long list of features to add to this.

### This is great, I really want to use this.

Sure, but one word of warning: do not get used to things working they way they do now. See above -- this software is extremely unfinished.

### I don't like this.

Okay.

### Who are you?

My name is Jason Scherer (@eeeeaaii on Twitter, [eeeeaaii@gmail.com](mailto:eeeeaaii@gmail.com)). I work on this in my spare time.

## License

All code is licensed under the Greater GPLv3.
