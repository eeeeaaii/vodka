import { setup } from './vodka.js'

// stamped by build.sh, so the console says which build this actually is
console.log('vodka build: '
		+ (typeof __VODKA_BUILD__ != 'undefined' ? __VODKA_BUILD__ : 'unstamped dev build'));

setup();

// The help system is the one preact island in the project. It's pulled in
// with a dynamic import so the bundler gives it its own chunk, which keeps
// the framework out of the main bundle.
import('./components/index.jsx');
