import { systemState } from '../systemstate.js';
import { buildURL } from '../help';
import { canSave } from '../deployment.js';

// sessions have a tab of their own now -- see sessions_panel.jsx
// (comment by Claude)
const WelcomePanel = () => {
    const sessionId = systemState.getSessionId();
    const oppositeTheme = (window.CSS_THEME == 'dark' ? 'light' : 'dark');

    return (
        <div className="infopanel">
            <p className="infotitle">Vodka</p>
            <p className="infosubheader">Release 0.5</p>
            <p className="infospacer"></p>
            <p className="infoline">Vodka is a creative coding environment for music and text.</p>
            <p className="infospacer"></p>
            <p className="infoline">More info about Vodka can be found at:</p>
            <p className="infoline"><a href="https://github.com/eeeeaaii/vodka">Github</a></p>
            <p className="infospacer"></p>
            <p className="infoline">There are also help pages and a tutorial/walkthrough accessible by the links above.</p>
            <p className="infospacer"></p>
            <p className="infoline">You are in the session <span id="sessionid">{sessionId}</span>. To open, make, rename or
                delete sessions, use the Sessions tab above.</p>
            {!canSave() && <p className="infoline">Saving and loading files is disabled
                on the web. If you clone the vodka repo and run a local server, you can save files
                within your session.</p>}
            <p className="infoline">To switch to {oppositeTheme} theme, click <a id="switchthemelink" href={buildURL({ "theme": oppositeTheme })}>here</a>.</p>
            <p className="infospacer"></p>
            <p className="infoline">Vodka is in beta and is a part-time side project.
                I will <b>do my best</b> to make sure your session data is preserved across product
                updates, but there are no guarantees.</p>
            <p className="infospacer"></p>
            <p className="infoline">Vodka is created by <a href="https://instagram.com/eeeeaaii">Jason Scherer (eeeeaaii)</a></p>
            <p className="infoline">You retain all copyright to any creative works you make with Vodka.</p>
            <p className="infoline">Changes to the Vodka framework itself are protected by <a href="https://www.gnu.org/licenses/">the GPL</a>.</p>
            <p className="infoline">If you have questions or want to report a problem, feel free to file an issue on github and assign it to me.</p>
            <p className="infospacer"></p>
        </div>
    );
};

export default WelcomePanel;
