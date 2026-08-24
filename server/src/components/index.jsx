// Mount point for the help system.
//
// This is the only part of vodka that uses a UI framework. Everything else
// (the rendering engine) is plain ES modules. Keep it that way.
import { render } from 'preact';
import App from './app.jsx';

render(<App />, document.getElementById('rootcomponents'));
