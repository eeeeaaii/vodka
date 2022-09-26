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


import * as Utils from './utils.js'

import { experiments } from './globalappflags.js'
import { systemState } from './systemstate.js'

var helpIsShowing = false;
var helpButtonIsShowing = true;
let apiDocCategory = '';
let pagesSeen = {};

let tutorialRunning = false;

let tutorialPageStack = [];
let tutorialPageStackPosition = -1;


let tutorialContent = {
	'start-tutorial': {
		title: `Hello!`,
		text: [
			`This tutorial will show you around the Vodka programming environment.`,
			`As you perform different actions in Vodka, this tutorial panel will give a short explanation of what's going on, and below there will be some suggestions of things you can try next.`,
			`In the upper left corner of the screen you can see a small flashing red dot. This is the "insertion pip" and it shows you where new objects will be inserted. You'll learn more about it later.`,
			`There is also a red border around the entire screen. This means the "root" is selected. At any point in time, you can identify what is selected by its red border.`,
			`As you go through this tutorial, you'll be able to go back to previous tutorial panels with the buttons below.`,
		],
		toTry: [
			`Holding down shift, one by one, type all the symbol characters along the top of your keyboard, from left to right, starting with the tilde ('~')`,
			`Press the arrow keys, tab, or shift-tab.`,
			`Select different objects and press the enter key.`,
			`Select different objects and press backspace or shift-backspace.`,
			`Type some other keys on the keyboard (try the a-z ones).`,
			`Select an object and press the backtick key (\`).`,
			`Type the open curly brace key ("{").`,
			`Type an underscore ("_").`,
			`Run the "builtins" command.`,
			`Hold down the alt/option key while using the navigation commands (arrows and tab)`,
			`Hold down the alt/option key while inserting objects using the symbol characters.`,
			`Try copying, pasting, undoing, and redoing with cmd (or ctrl) z, x, c, v, and y.`,
			`Press escape.`,
		],
	},
	'tooltip': {
		title: `Life Pro Tips`,
		text: [
			`Woah, what's that? This is a tooltip box, used by Vodka to give you information about a valid command. In Vodka, a valid command is one whose name is bound to a "closure" (a function object).`,
			`The tooltip box has a '&' symbol in it to remind you that it's describing a closure, and will contain the name of the command, its full parameter signature, a documentation string that describes what the command does, and sometimes, a representation of the code of the function.`,
			`Sometimes commands have aliases, so the name you typed may not match exactly what is in the tooltip. Vodka will rewrite aliased names when you exit the sub-editor.`,
		],
		toTry: [
			`Press the enter key to finish editing this command and press enter again to actually evalute it. Does it do what the tooltip said it would do?`,
			`Examine the parameter types and make sure you pass the right arguments to this command when you evaluate it.`,
			`Try passing the wrong number of arguments, or arguments that are the wrong types.`,
			`Exit this sub-editor and create a symbol with the exact same name that generated this tooltip, and evaluate the symbol to retrieve the closure from memory so you can see it.`,
		],
	},
	'make-command': {
		title: `You're In Command`,
		text: [
			`You've created a command. You'll be doing this a lot! A command is a named object that can perform some function.`,
			`You're now in the "sub-editor," which is a mini text editor just for this command, that allows you to change its name. Once you exit the sub-editor, you'll go back out to the main Vodka editing environment.`,
			`In addition to having a name, commands can contain arguments. The arguments inside this command will be passed to the command when it is executed. The insertion pip shows where the arguments need to go.`,
			`To execute a valid command, select it and hit the enter key.`,
		],
		toTry: [
			`Type some letters or symbols or use the backspace key to change the command name (for example, try naming it "+").`,
			`Quit the sub-editor by pressing enter (then re-enter the sub-editor by pressing backspace).`,
			`Add some arguments to the command by pressing insertion keys (for example, #) when the insertion pip is inside the command.`,
			`Type something short (like the letter "c") and press ctrl-space or alt-space repeatedly to get some autocompletion suggestions`,
			`Use shift-space to toggle the direction of the command between horizontal and vertical.`,
			`Try using spaces in the command name and then adding some arguments.`,
			`Type a character that isn't allowed in command names (like '@')`,
		],
	},
	'make-boolean': {
		title: `Truth or Dare`,
		text: [
			`You've created a boolean value. This value can either be true or false, indicated with a big T or F.`,
		],
		toTry: [
			`Type keys on the keyboard to toggle the value back and forth between true and false.`,
			`Quit the sub-editor by pressing enter (then re-enter the sub-editor by pressing backspace).`,
			`Type delete or shift-delete to get rid of this boolean.`
		],
	},
	'make-integer': {
		title: `Can You Count to Ten?`,
		text: [
			`You've created an integer value. Way to go! Integers in Vodka are pretty much exactly what you'd expect them to be. Integers have sub-editors just like commands.`,
		],
		toTry: [
			`In the sub-editor, type some numbers or use the backspace to change the value of this integer.`,
			`Quit the sub-editor by pressing enter (then re-enter the sub-editor by pressing backspace).`,
			`Try typing a decimal point, even though it's not allowed in an integer`,
			`Type the minus sign repeatedly to toggle this integer between positive and negative.`,
			`Try making nonsensical numbers, like "0000" or "-0".`,
		],
	},
	'make-symbol': {
		title: `The Symbolism of it All`,
		text: [
			`You've created a symbol. You can think of like a variable name. Symbols can be bound to values and are used as identifiers when defining things like templates (an advanced topic).`,
			`Like other programming languages, in Vodka symbol names are restricted to mostly alphanumeric characters. However, unlike in other languages, spaces are also allowed too!`,
		],
		toTry: [
			`Type some letters or backspace to change the name of this symbol.`,
			`Press enter to stop editing this symbol.`,
			`Quit the sub-editor by pressing enter (then re-enter the sub-editor by pressing backspace).`,
			`Name your symbol "head" and try to evaluate it by quitting the sub-editor and pressing enter again.`,
			`Type "asdfjkl" (or some other random thing you know isn't bound to anything) and try the same thing.`,
			`While editing, type a character that's not allowed in a symbol name (like "&"").`,
			`Bind this symbol to a value with the "bind to" builtin command.`,
			`Bind this symbol to something and then evaluate the symbol (press enter on it) in two different places on the screen.`,
		],
	},
	'make-string': {
		title: `String Theory`,
		text: [
			`You've created a string value. Strings can contain any sort of typed character, including carriage returns. This sub-editor gives you a place to type in your string. You can resize the sub-editor to see more of the string, and click "done" when you're finished creating it.`,
		],
		toTry: [
			`Type in text.`,
			`Type the enter key and see that it doesn't quit the sub-editor.`,
			`Paste in some long text with multiple lines.`,
			`Click "done" when you're finished`,
		],
	},
	'make-float': {
		title: `Floating in the Sea`,
		text: [
			`You've created a floating point number. This can hold any value that can be expressed with decimals.`,
		],
		toTry: [
			`Type some numbers, then type a decimal point, then more numbers.`,
			`Type entering in a nonsensical number, like "00004." or "0.00000".`,
			`Type the minus sign to toggle between negative and positive.`,
		],
	},
	'make-instantiator': {
		title: `In an Instance`,
		text: [
			`You've created an instantiator. This is like a command, but it's specifically used to create instances of templates. You can think of it like the "new" operator in languages like Java or C++.`,
		],
		toTry: [
			`Templates are an advanced topic, but you can try defining a template using the "template" builtin command.`,
		],
	},
	'make-lambda': {
		title: `Going Greek`,
		text: [
			`You've created a lambda expression. This evaluates to a closure, which can be used to run code. The sub-editor allows you to define the functional parameters of the closure. You can separate multiple parameters with spaces (like "a b c") or you can further specify parameter types with the same symbols that you'd type to create that value (so for example, "a# b$" would mean that the parameters to the function are an integer and a string). The contents of the lambda expression is the code of the function.`,
		],
		toTry: [
			`Define a function that takes one parameter, an integer, and increments it.`,
			`Type enter while the lambda is selected to see the closure that is generated when it is evaluated.`,
			`Call "bind to" to bind a symbol to a closure so you can call that function from a command.`,
			`Use shift-space to toggle the direction of the lambda between horizontal and vertical.`,
		],
	},
	'make-deferred-command': {
		title: `Applying for a Deferral`,
		text: [
			`You've created a deferred command. Deferred commands work like regular commands in some ways, but are a little different. They are part of a pair of related object types, where the other half of the pair is a "deferred value." Deferred values are values that don't exist yet or which haven't been computed yet, but which will appear sometime in the future.`,
			`If a deferred command is just passed normal arguments, it evaluates those arguments and returns the results, like a regular command. However if it is passed deferred values, it will wait for all those deferred values to finish computing their values before it will resolve itself.`,
		],
		toTry: [
			`Run the "wait-for-delay" command, passing it a number of milliseconds that you want to wait (for example, 1000).`,
			`Create a deferred command that adds together its arguments, and pass it two "wait-for-delay's"`,
		],
	},
	'make-org': {
		title: `Org Chart`,
		text: [
			`You've created an org. An org is just a list of things, basically. It's a container.`,
		],
		toTry: [
			`Add child objects to this org.`,
			`Use tab and shift-tab to descend into or come out of the org.`,
			`Add some orgs inside this one to get nested levels of orgs.`,
			`Use shift-space to toggle the direction of the org between three states: vertical, horizontal, and an orientation where the contents overlap.`,
		],
	},
	'tag-editor': {
		title: `Playing Tag`,
		text: [
			`You've entered the tag editor. Tags are used to add additional metadata to program objects. They work a little bit like code annotations, but have runtime functionality.`,
			`Tags are especially useful for labeling different members of a data structure. For example, if you wanted a list that represented a rectangle, you might have two integers, one tagged with "width" and one tagged with "height".`,
		],
		toTry: [
			`Type letters or backspace to edit a tag name.`,
			`Type the right or left arrow keys to add additional tags.`,
			`Try giving this object two tags with the exact same name.`,
			`Press enter to leave the tag editor.`,
			`Re-enter the tag editor by pressing "\`" again, and change a tag you already added.`,
		],
	},
	'mutability': {
		title: `Adaptive Mutation`,
		text: [
			`You've evaluated this object but now it looks different. Why?`,
			`Objects in Vodka can be in two states: immutable and mutable. Mutable objects have thick borders, and can have their values (such as the number value of an integer object) edited. Immutable objects have thin borders and are fixed forever -- their values can't be changed.`,
			`Additionally, mutable and immutable objects behave differently when evaluated. Evaluating an immutable object just returns the same object. But evaluating a mutable object produces an immutable copy of it. That's what you're seeing now.`,
			`Orgs and other container types can also be mutable or immutable. Evaluating an immutable org just returns a reference to the same org. However, evaluating a mutable org produces an immutable org containing the result of evaluating all the objects inside the original org.`,
			`In source code you write, you generally want to use mutable objects and orgs, unless you know what you're doing.`,
		],
		toTry: [
			`Create an org with some children and evaluate it.`,
			`Evaluate an immutable org or object.`,
			`Create a string, evaluate it to get an immutable copy, then try to edit the string`,
			`Write a function that uses hard-push to put objects inside an immutable list. Then keep the function source code on the screen, and run the function.`,
		],
	},
	'evaluation': {
		title: `Passing Your Evaluation`,
		text: [
			`This is a big milestone. You've evaluated some code, returning a result.`,
			`Vodka is less like an IDE and more like a debugger that you can edit. You can run edit and run code all the time, and to create an application for end users you just turn off the IDE features and let them use what you created.`,
			`There are two ways to evaluate code. Eval-and-replace is when an object is evaluated and replaced with the result of its evaluation (this is what you just did). You can also do "eval-and-keep", which evaluates the code but doesn't replace the selected object. This is useful if the code that you are evaluating has some side effects (changes something else) but the value it returns isn't important.`,
		],
		toTry: [
			`Try evaluating some code that will produce an error (like dividing by zero)`,
			`Use shift-enter to "eval-and-keep".`,
		],
	},
	'movement': {
		title: `Get Moving`,
		text: [
			`Vodka is a little different than most text editors, because instead of rows of text laid out like a page in a typewriter, you are modifying a "tree structure" that represents your program. So moving your cursor around with the arrow keys works differently than in a normal text editor. The movement keys can change both what object is selected and where the insertion pip is.`,
			`There are essentially four possible directions you can move:`,
			`1. forward to the next object (right arrow or down arrow)`,
			`2. back to the previous object (left arrow or up arrow)`,
			`3. "inside" the selected object (tab, only works if the selected object is a container)`,
			`4. "back outside" the container holding the current object.`,
		],
		toTry: [
			`Create a set of nested containers (such as orgs) and try moving around with the movement keys to get a feel for how they work.`,
			`If the default movement of the insertion pip doesn't do what you want, try holding option while using a movement key to lock the selected object and just move the insertion pip.`,
			`Try using "option-shift-tab". Where is the insertion pip now? What happens if you insert a container, or a non-container?`,
			`Try holding option-shift while using the object insertion keys for container objects, such as '~' or '&'`,
		],
	},
	'delete': {
		title: `Waste Removal`,
		text: [
			`You've deleted something. When you gotta do it, you gotta do it. Vodka has two ways to delete things.`,
			`One way is to just use backspace (or delete), which fluidly enters and leaves sub-editors, deleting one character at a time and deleting objects when their sub editors are empty. This way is fairly safe, in that you can't delete a lot at once.`,
			`The other way is to use shift-backspace (or shift-delete). This deletes an entire object at once with extreme prejudice, even deleting all the children if it's a container object.`,
			`If you delete too much, don't worry, Vodka does contain an undo feature! Use command-z (or ctrl-z) to undo.`,
		],
		toTry: [
			`Try using backspace to delete the letters in the name of a command, and then finally delete the command itself.`,
			`Create a big nested structure of objects and, starting at the innermost, use backspace to gradually delete the entire structure`,
			`Use shift-delete to delete a container with a lot of things in it, and then use undo to bring it back.`,
		],
	},
	'doc': {
		title: `Secret Documents`,
		text: [
			`Wow, look at you. You've created a doc. You're really getting into it now.`,
			`A doc in Vodka is a special object that can be used to type richly formatted text. You can think of a doc like a small word processor embedded in your Vodka program. It can be used to document your code (like code comments), but it can also be used for creative coding or building user interfaces.`,
			`When you type text into a doc, Vodka will interpret your keystrokes differently than normally. For example, if you just start typing letters outside of a doc, Vodka will create a command for you, assuming that's what you wanted to do. However, inside a doc, Vodka will start creating special doc-related objects: specifically, letters, lines, and words.`,
			`Letters are user interface elements rather than code: they can have a font, a size, etc. A word is just a list of letters, and a line is just a list of words.`,
			`Inside a doc, you can embed code (like commands), so you can do things like have text than animates or changes in time. This is where you can start getting creative!`
		],
		toTry: [
			`Start typing a paragraph into this doc.`,
			`Use backspace and the arrow keys to move around in this doc the same way you would a word processor.`,
			`Write a function that takes two arguments and randomly chooses between them. Try writing a sentence in a doc that randomly chooses between saying "I like cats" and "I like dogs".`,
		],
	},
	'wavetable': {
		title: `Waving Hello`,
		text: [
			`Ooh, this looks interesting. You've created a wavetable.`,
			`A wavetable is little snippet of sound. It can be used to store one cycle of a waveform, short samples of sound (like drum hits), or even whole songs. Wavetables have their own sub-editor too, which can be used to set up slices, like in a sampler. To use the sub-editor, just hit backspace like with any other object.`,
			`Vodka contains a whole set of different functions for working with wavetables: they can be played back, recorded with your computer microphone, and composited and processed. A full description of these features is beyond the scope of this tutorial.`,
		],
		toTry: [
			`Run the "squarewave", "sinewave", and "ramp" commands.`,
			`Click on the wavetable and drag to the right or up, then try dragging down or to the left.`,
			`When a non-silent wavetable is selected, press the enter key and hold it down for a while.`,
			`Try passing wavetables to the "seq", "gain" and "mix" commands.`,
		],
	},
	'object-tags': {
		title: `Identity Crisis`,
		text: [
			`If you look closely, you might see that on the screen there is a mysterious, small rectangular label attached to two (or more) objects on the screen. This is an identity tag, which contains the unique "oid" (object ID) of the object it's attached to.`,
			`Every object has an oid, but usually they are hidden and aren't important. However, in the unusual event that the same object appears in more than one place on the screen, oids become important. If an object is rendered (drawn) twice, it will be rendered with an oid, and the oids will match so you can see that they are exactly the same object. Changing one will change the other, because they are actually the same memory location.`,
			`Vodka programs are rendered on the screen like hierarchical trees of data, but there's nothing actually enforcing that they are really trees. Graph structures or cyclical structures can be created and operated on with code.`,
		],
		toTry: [
			`Get a mutable object to show up on the screen in more than one place, and then mutate the object (change the integer value) in one of the places.`,
			`Create a complicated nested structure and get it to show up on the screen in multiple places.`,
			`Put a container inside itself and render it on the screen (get ready to be surprised).`
		],
	}
}

function setTutorialStackPosition(n) {
	tutorialPageStackPosition = n;
	document.getElementById('previoustutorialpagebutton').style.display = 'block';
	document.getElementById('nexttutorialpagebutton').style.display = 'block';
	if (n == 0) {
		document.getElementById('previoustutorialpagebutton').style.display = 'none';
	}
	if (n == tutorialPageStack.length - 1) {
		document.getElementById('nexttutorialpagebutton').style.display = 'none';
	}
}

function doTutorial(pageId) {
	if (!tutorialRunning) {
		return false;
	}
	if (tutorialContent[pageId] && !pagesSeen[pageId]) {
		tutorialPageStack.push(pageId);
		pagesSeen[pageId] = true;
		setTutorialStackPosition(tutorialPageStack.length - 1);
		showTutorialPage(pageId);
		return true;
	} else {
		return false;
	}
}

function previousTutorialPage() {
	setTutorialStackPosition(tutorialPageStackPosition - 1);
	let pageId = tutorialPageStack[tutorialPageStackPosition];
	showTutorialPage(pageId);	
}

function nextTutorialPage() {
	setTutorialStackPosition(tutorialPageStackPosition + 1);
	let pageId = tutorialPageStack[tutorialPageStackPosition];
	showTutorialPage(pageId);	
}

function showTutorialPage(pageId) {
	populateTutorialPage(tutorialContent[pageId])

	openTutorialPanel();
}

function populateTutorialPage(obj) {
	let prevbutton = document.getElementById('previoustutorialpagebutton')

	let title = document.getElementById('tutorialtitle');
	title.innerText = obj.title;

	let tutorialcontent = document.getElementById('tutorialcontent');
	let tc = '';
	for (let i = 0; i < obj.text.length; i++) {
		tc += `<p class="infolinemargin">${obj.text[i]}</p>`
	}
	tutorialcontent.innerHTML = tc;

	let tryset = document.getElementById('tryset');
	tryset.innerHTML = '';
	let grp = getMoreGroup(obj.toTry, 0);
	grp.style.display = 'block';
	tryset.appendChild(grp)
}

function getMoreGroup(a, start) {
	let ts = '';
	let grp = document.createElement('div');
	grp.classList.add('trygroup');
	let ul = document.createElement('ul');
	let i = start;
	for (; i < start + 3 && i < a.length; i++) {
		let li = document.createElement('li');
		li.innerText = a[i];
		li.classList.add('infolinemargin');
		li.classList.add('infolineitalic');
		ul.appendChild(li);
	}
	grp.appendChild(ul);
	if (i < a.length ) {
		let childGroup = getMoreGroup(a, start + 3);
		let more = document.createElement('div');
		more.classList.add('trymore');
		more.classList.add('helpbutton');
		more.innerText = 'more...';
		grp.appendChild(more);
		more.onclick = function() {
			childGroup.style.display = 'block';
			more.style.display = 'none';
		}
		grp.appendChild(childGroup);
	}
	return grp;
}

let left = 200;
let top = 50;

let previousX = 0;
let previousY = 0;

function setupTutorialDrag() {
	let t = document.getElementById('tutorialpanel');
	t.onmousedown = function(e) {
		previousX = e.clientX;
		previousY = e.clientY;
		t.onmousemove = function(e) {
			let deltaX = e.clientX - previousX;
			let deltaY = e.clientY - previousY;
			previousX = e.clientX;
			previousY = e.clientY;
			left += deltaX;
			top += deltaY;
			t.style.left = '' + left + 'px';
			t.style.top = '' + top + 'px';
			return false;
		}
		t.onmouseup = function(e) {
			let deltaX = e.clientX - previousX;
			let deltaY = e.clientY - previousY;
			previousX = e.clientX;
			previousY = e.clientY;
			left += deltaX;
			top += deltaY;

			t.onmousemove = null;
			t.onmouseup = null;
		}
		return false;
	}
}

function startTutorial() {

	document.getElementById('tutorialpanel').style.display = 'block';
	document.getElementById('helpholder').style.display = 'none';

	document.getElementById('helpbutton').style.display = 'none';
	document.getElementById('endtutorialtopbutton').style.display = 'flex';

	tutorialRunning = true;

	showTutorialPage('start-tutorial');
	tutorialPageStack.push('start-tutorial');
	pagesSeen['start-tutorial'] = true;
	setTutorialStackPosition(0);


	systemState.setKeyFunnelActive(true);
}

function endTutorial() {

	closeTutorialPanel();

	document.getElementById('tutorialpanel').style.display = 'none';
	document.getElementById('helpholder').style.display = 'block';

	document.getElementById('helpbutton').style.display = 'flex';
	document.getElementById('endtutorialtopbutton').style.display = 'none';

	tutorialRunning = false;
}

function openTutorialPanel() {
	showHelpPanel(true /* allow key funnel */);
}

function closeTutorialPanel() {
	hideHelpPanel();
}



// help pages:
//    intro
//    hotkeyreference
function showHelpPage(id) {
	if (document.getElementById(id)) {
		document.getElementById('intro').style.display = 'none';
		document.getElementById('hotkeyreference').style.display = 'none';
		document.getElementById('fullapireference').style.display = 'none';
		document.getElementById(id).style.display = 'block';
		window.scrollTo(0,0);
	}
}

function showHelpButton() {
	helpButtonIsShowing = true;
	document.getElementById('helpbutton').style.display = 'flex';
}

function hideHelpButton() {
	helpButtonIsShowing = false;
	document.getElementById('helpbutton').style.display = 'none';
}

function showHelpPanel(allowKeyFunnel) {
	helpIsShowing = true;
	document.getElementById('uberhelpcontainer').style.display = 'flex';
	if (!allowKeyFunnel) {
		systemState.setKeyFunnelActive(false);
	}
}

function hideHelpPanel() {
	helpIsShowing = false;
	document.getElementById('uberhelpcontainer').style.display = 'none';
	window.scrollTo(0,0);
	systemState.setKeyFunnelActive(true);
}

function toggleHelp() {
	if (helpIsShowing) {
		hideHelpPanel();
		showHelpButton();
	} else {
		showHelpPanel();
		hideHelpButton();
	}
}


function isFirstVisit() {
	return !Utils.getCookie('userhasvisited');
}

function setVeteranCookie() {
	if (isFirstVisit()) {
		document.cookie = 'userhasvisited=true';	
	}
}

function maybeShowHelp() {
	showHelpPage('hotkeyreference');
	if (experiments.NO_SPLASH) {
		// this is used in tests
		hideHelpPanel();
		hideHelpButton();
	} else if (hasShowHelpInQueryString()) {
		showHelpPanel();
		hideHelpButton();
	} else if (isFirstVisit()) {
		showHelpPanel();
		showHelpPage('intro');
		hideHelpButton();
	} else if (userAskedToHideHelpButton()) {
		hideHelpPanel();
		hideHelpButton();
	} else {
		hideHelpPanel();
		showHelpButton();
	}
}



function doPermanentHelpHide() {
	if (confirm(
`Note: clicking "ok" will permanently hide the help button.
You can always get back to help by adding "help=me" to the query string.
Only do this if you know what you're doing!
`)) {
		hideHelpPanel();
		hideHelpButton();
		document.cookie = 'hidehelpbutton=true';
		toggleHelpButtonButtons();
	}
}

function bringBackHelp() {
	hideHelpPanel();
	showHelpButton();
	document.cookie = 'hidehelpbutton=false';
	toggleHelpButtonButtons();
}

function hasShowHelpInQueryString() {
	var params = new URLSearchParams(window.location.search);
	return params.has('help');
}

function userAskedToHideHelpButton() {
	return (Utils.getCookie('hidehelpbutton') == 'true');
}

function buildURL(obj) {
	if (!obj.theme) {
		obj.theme = CSS_THEME;
	}
	if (!obj.sessionId) {
		obj.sessionId = systemState.getSessionId();
	}

	let r = `http://${FEATURE_VECTOR.hostname}`;
	let first = true;
	for (let k in obj) {
		if (obj[k] == null) {
			continue;
		}
		r += (first ? '?' : '&');
		r += k;
		r += '=';
		r += obj[k];
		first = false;
	}
	return r;
}

function setupHelp() {

	// at this point I'm not doing anything to hide the help button but
	// that's what this was supposed to be
	document.getElementById('bringbackhelp').style.display = 'none';
	document.getElementById('closehelppermanently').style.display = 'none';				


	setupTutorialDrag();

	document.getElementById('tutorialpanel').style.display = 'none';

	document.getElementById('endtutorialtopbutton').style.display = 'none';



	// tutorial menu
	document.getElementById('closetutorialpage').onclick = function(c) {
		closeTutorialPanel();
	}
	document.getElementById('previoustutorialpagebutton').onclick = function(c) {
		previousTutorialPage();
	}
	document.getElementById('nexttutorialpagebutton').onclick = function(c) {
		nextTutorialPage();
	}
	document.getElementById('endtutorial').onclick = function(c) {
		endTutorial();
	}

	document.getElementById('previoustutorialpagebutton').style.display = 'none';
	document.getElementById('nexttutorialpagebutton').style.display = 'none';



	document.getElementById('endtutorialtopbutton').onclick = function(c) {
		endTutorial();
	}
	document.getElementById('starttutorialbutton').onclick = function(c) {
		startTutorial();
	}

	document.getElementById('helpbutton').onclick = function(c) {
		toggleHelp();
	}
	document.getElementById('showhotkeys').onclick = function(c) {
		showHelpPage('hotkeyreference');
	}
	document.getElementById('showapi').onclick = function(c) {
		showHelpPage('fullapireference');
	}
	document.getElementById('showwelcome').onclick = function(c) {
		showHelpPage('intro');
	}
	document.getElementById('closehelp').onclick = function(c) {
		toggleHelp();
	}
	document.getElementById('closehelppermanently').onclick = function(c) {
		doPermanentHelpHide();
	}
	document.getElementById('bringbackhelp').onclick = function(c) {
		bringBackHelp();
	}
	let sessionId = systemState.getSessionId();
	let oppositeTheme = (CSS_THEME == 'dark' ? 'light' : 'dark');
	document.getElementById('sessionid').innerText = sessionId;
	document.getElementById('sessionlink').href = buildURL({ "sessionId":sessionId });
	document.getElementById('newsessionlink').href = buildURL({ "sessionId":null, "new":1 });
	document.getElementById('copysessionlink').href = buildURL({ "sessionId":null,"copy":1 });
	document.getElementById('sharesessionlink').href = buildURL({ "sessionId":null, "copy":1, "type":"readonly" });
	document.getElementById('switchthemelink').href = buildURL({ "theme":oppositeTheme });

	maybeShowHelp();

	if (tutorialRunning) {
		startTutorial();
	}
	setVeteranCookie();

}


export { setupHelp, doTutorial }




