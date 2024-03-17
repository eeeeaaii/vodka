import React from 'react';

const WelcomePanel = () => {
    return (

        <div className="infopanel">
        <p className="infotitle">Vodka</p>
        <p className="infosubheader">Release 0.4.2</p>
        <p className="infoline"><a href="https://github.com/eeeeaaii/vodka/blob/main/CHANGES.md">Release Notes</a></p>
        <p className="infospacer"></p>
        <p className="infoline">Vodka is a creative coding environment for music and text.</p>
        <p className="infospacer"></p>
        <p className="infoline">More info about Vodka can be found at:</p>
        <p className="infoline"><a href="https://github.com/eeeeaaii/vodka">Github</a></p>
        <p className="infospacer"></p>
        <p className="infoline">There are also help pages and a tutorial/walkthrough accessible by the links above.</p>
        <p className="infospacer"></p>
        <p className="infoline">Your session ID is <span id="sessionid">1234</span>.</p>
        <p className="infoline">All data you save via the (_save_) and (_save-file_) builtins is sandboxed to this session.</p>
        <p className="infoline">You can access this session again with <a id="sessionlink" href="">this link</a>.</p>
        <p className="infoline">You can leave this session and start a whole new session with <a id="newsessionlink" href="">this link</a>.</p>
        <p className="infoline">You can create an exact copy of this session (with all the same saved files) with <a id="copysessionlink" href="">this link</a>.</p>
        <p className="infoline">You can create a read-only copy of this session (e.g. for sharing on social media) with <a id="sharesessionlink" href="">this link</a>.</p>
        <p className="infoline">To have a file load and be evaluated in normal mode at startup when a session link is visited, name the file "start-doc".</p>
        <p className="infoline">To switch to <script>
            document.write(CSS_THEME == 'dark' ? 'light' : 'dark');
        </script> theme, click <a id="switchthemelink" href="">here</a></p>


        <p className="infospacer"></p>
        <p className="infoline">Vodka is in alpha and is under active development. I will <b>do my best</b> to preserve your data as much as I can. However:</p>
        <p className="infoline">- Sessions and sandbox contents may need to be deleted at any time without notice.</p>
        <p className="infoline">- Long term persistence of session contents is not guaranteed.</p>
        <p className="infoline">- Uptime or availability is not guaranteed.</p>
        <p className="infoline">- Sessions are not backed up in any way.</p>
        <p className="infoline">In addition, in the absence of problems, I may still periodically go through and delete old, inactive sessions. In other words, if you make something you like, it's probably prudent to capture it in some other way besides storing it here.</p>
        <p className="infospacer"></p>
        <p className="infoline">Abusive, harmful or illegal content of any kind is not allowed on this server.</p>
        <p className="infoline">The site admin (eeeeaaii) is the sole arbiter of what is allowed.</p>
        <p className="infoline">Disallowed content will be deleted immediately.</p>
        <p className="infospacer"></p>
        <p className="infoline">Vodka is created by <a href="https://twitter.com/eeeeaaii">Jason Scherer (eeeeaaii)</a></p>
        <p className="infoline">You retain all copyright to any creative works you make with Vodka.</p>
        <p className="infoline">Changes to the Vodka framework itself are protected by <a href="https://www.gnu.org/licenses/">the GPL</a>.</p>
        <p className="infoline">If you have questions or want to report a problem, join <a href="https://groups.google.com/g/vodka-users">vodka-users@googlegroups.com</a> and send an email.</p>
        <p className="infospacer"></p>
    </div>
);
};

export default WelcomePanel;
