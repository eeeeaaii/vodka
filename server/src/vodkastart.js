import { setup } from './vodka.js'
setup();

// The help system is the one preact island in the project. It's pulled in
// with a dynamic import so the bundler gives it its own chunk, which keeps
// the framework out of the main bundle.
import('./components/index.jsx');
