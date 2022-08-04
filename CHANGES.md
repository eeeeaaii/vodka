# Vodka: Release Notes

## Version 0.4.2 - 8/4/22

- Fixed internal and saved representation of wavetables
- Created publish and read-only mechanism
- Implemented memory management layer on top of JS native
- Cleaned up and fixed wavetable builtins and added a few new ones
- Fixed issues with deferred commands and values

## Version 0.4.1 - 5/16/22

- Added deferred value and deferred command types, removed expectations
- Replaced broken undo system with an action-queue based undo
- Added tutorial and cleaned up help system
- Lots of code cleanup and deletion of dead code
- Removal of some features that I don't plan to support (foreign lambdas, native orgs)
- Fixed SOME tests (not done!)

## Release 4 - spring 2022

- Added wavetable support
- Added midi support
- Added help files
- Updated documentation
- Defaulting to "exploded" mode
- changed visual display so that backspace-to-edit is more intuitive
- changed "set" to "wait-for" for expectations
- reorganized and cleaned up library files and made a new samples directory
- changed pip traversal to be more intuitive, and made it so you can see the pip easier
- escape key in editor cancels/aborts the edit
- created "autoreset" builtin for expectations and got rid of "repeat" expectation
- cleaned up save/load to be more intuitive
- modify packages directory by modifying query string
- refactored activation function generator
- put back some of the aliasing that I removed for reasons I can't remember
- made a thing that autogenerates help files from the help strings in the builtins
- made list-files builtin
- tweaked expectation rendering again, hopefully for the last time
- changed the way post-eval things happen in the REPL (i.e. activating expectations, making immutable)
- fixed display of root node being selected so you can see that something is going on

## Release 3 - 1/18/21

- Really fixed undo
- Added set-contents-changed builtin
- Fixed get-pixel-height and get-pixel-width
- Added third z-directional orientation to orgs
- Backspace doesn't exit editor or delete nex
- changed word insert to left angle bracket
- changed org insert to left paren
- added "close the paren" functionality to right paren, right brace, right bracket, right angle bracket
- tooltips added
- added rootmanager class
- added support for receiver syntax
- changed display of tags in commands, lambdas, etc.
- added instantiator nex
- removed support for directly adding nil type
- changed display of nil type
- some test and test framework changes
- save builtin evaluates arg, save-package builtin added
- added repl
- dirty-only rendering

## Release 2 - 12/10/20

- Fixed undo
- Updated splash screen with link to release notes
- Fixed bug where unable to save some files due to filename regex bug
- Changed default keybindings so symbols can be typed in doc context

## Release 1

Initial release

## Additional information

More information on early release changes is available in the ["changeblog"](CHANGEBLOG.txt)
