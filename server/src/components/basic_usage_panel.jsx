import React from 'react';

const BasicUsagePanel = () => {
    return (
        <div className="infopanel">
        <p className="infotitle">Basic Usage</p>
        <p className="infosubheader">Some general notes:</p>
        <p className="infolinemargin">You can insert different sorts of objects (sometimes called "nexes").</p>
        <p className="infolinemargin">Depending on its type, an object will usually have some kind of associated data, like a string value or a number.</p>
        <p className="infolinemargin">Some objects also are containers for other objects. Others are "atoms" and just have associated data, but no child objects.</p>
        <p className="infolinemargin">One (and only one) object can be selected at a time. It will have a red border.</p>
        <p className="infolinemargin">You can use the "movement" hotkeys to change which object is selected, or click to select an object.</p>
        <p className="infolinemargin">The small dot near the currently selected object is the "insertion pip." This tells you where the next inserted object will appear. The insertion pip can be moved around, but it will always be near the selected object.</p>
        <p className="infolinemargin">To edit the data associated with an object, you have to be in "edit mode" (the object will have a pink background). You have to exit edit mode to insert more objects.</p>
        <p className="infolinemargin">Objects with thin borders are immutable, and their associated data can't be edited.</p>
        <p className="infolinemargin">Objects can be evaluated, which causes them to "do something".</p>
        <p className="infolinemargin">Evaluating commands will execute some code.</p>
        <p className="infolinemargin">Objects can be given tags, which are used for various annotation-type purposes.</p>
        <p className="infoline"></p>
        <p className="infospacer"></p>
        <p className="infosubheader">Atomic types:</p>
        <p className="infoline"><span className="infohotkey">!</span>insert a boolean</p>
        <p className="infoline"><span className="infohotkey">@</span>insert a symbol</p>
        <p className="infoline"><span className="infohotkey">#</span>insert an integer</p>
        <p className="infoline"><span className="infohotkey">$</span>insert a string</p>
        <p className="infoline"><span className="infohotkey">%</span>insert a float</p>
        <p className="infospacer"></p>
        <p className="infosubheader">Container types:</p>
        <p className="infoline"><span className="infohotkey">~</span>insert a command</p>
        <p className="infoline"><span className="infohotkey">^</span>insert an instantiator</p>
        <p className="infoline"><span className="infohotkey">&</span>insert a lambda</p>
        <p className="infoline"><span className="infohotkey">*</span>insert a deferred command</p>
        <p className="infoline"><span className="infohotkey">(</span>insert an obj</p>
        <p className="infospacer"></p>
        <p className="infosubheader">Special types:</p>
        <p className="infoline"><span className="infohotkey">_</span>insert a wavetable</p>
        <p className="infoline"><span className="infohotkey">{'{'}</span>insert a doc</p>
        <p className="infoline"><span className="infohotkey">{'['}</span>insert a line</p>
        <p className="infoline"><span className="infohotkey">{'<'}</span>insert a word</p>
        <p className="infoline">Typing letters inside docs, lines, or words will insert letter objects.</p>
        <p className="infospacer"></p>
        <p className="infosubheader">Movement:</p>
        <p className="infoline"><span className="infohotkey">rightarrow</span>or <span className="infohotkey">downarrow</span>select next object in this container (to the right or below)</p>
        <p className="infoline"><span className="infohotkey">leftarrow</span>or <span className="infohotkey">uparrow</span>select previous object in this container (to the left or above)</p>
        <p className="infoline"><span className="infohotkey">tab</span>"go in" -- select first child of selected container (just moves insertion pip if container is empty)</p>
        <p className="infoline"><span className="infohotkey">shift-tab</span>"come out" -- select parent of selected object</p>
        <p className="infospacer"></p>
        <p className="infoline"><span className="infohotkey"><span className="optionkey">option</span>-leftarrow</span>or <span className="infohotkey"><span className="optionkey">option</span>-uparrow</span>move the insertion pip to before the currently selected object</p>
        <p className="infoline"><span className="infohotkey"><span className="optionkey">option</span>-rightarrow</span>or <span className="infohotkey"><span className="optionkey">option</span>-downarrow</span>move the insertion pip to after the currently selected object</p>
        <p className="infoline"><span className="infohotkey"><span className="optionkey">option</span>-tab</span>move the insertion pip inside the currently selected container</p>
        <p className="infoline"><span className="infohotkey"><span className="optionkey">option</span>-shift-tab</span>set the insertion pip to be a rectangle enclosing the currently selected object (only containers can be inserted this way)</p>
        <p className="infospacer"></p>
        <p className="infoline">
            <span className="infohotkey">)</span>
            <span className="infohotkey">&gt;</span>
            <span className="infohotkey">{'}'}</span>
            <span className="infohotkey">{']'}</span>"close parens" -- move up to nearest corresponding container type and put insertion pip after it</p>

        <p className="infospacer"></p>
        <p className="infospacer"></p>
        <p className="infosubheader">Other:</p>
        <p className="infoline"><span className="infohotkey">`</span>activate the tag editor for the selected object</p>
        <p className="infospacer"></p>
        <p className="infoline"><span className="infohotkey">enter</span>evaluate the currently selected object and replace it with the result.</p>
        <p className="infoline"><span className="infohotkey">shift-enter</span>evaluate the currently selected nex for side effects, but don't replace it.</p>
        <p className="infospacer"></p>
        <p className="infoline"><span className="infohotkey">delete</span>enters edit mode for currently selected object</p>
        <p className="infospacer"></p>
        <p className="infoline"><span className="infohotkey">shift-delete</span>deletes current object completely, including all children if it is a container</p>
        <p className="infospacer"></p>
        <p className="infoline"><span className="infohotkey">shift-space</span>toggles direction of current container (horizontal/vertical)</p>
        <p className="infospacer"></p>
        <p className="infoline"><span className="infohotkey">shift-escape</span>toggle exploded/normal modes for entire document</p>
        <p className="infoline"><span className="infohotkey">shift-alt-escape</span>toggle exploded/normal modes for selected object (and its children)</p>
        <p className="infospacer"></p>
        <p className="infoline"><span className="infohotkey"><span className="optionkey">option</span>-shift</span>and any of&nbsp;<span className="infohotkey">{'~&*^({[<'}</span>wrap-inserts the specified container around the currently selected object</p>
        <p className="infospacer"></p>
        <p className="infoline"><span className="infohotkey"><span className="metakey">cmd</span>-c</span>copy</p>
        <p className="infoline"><span className="infohotkey"><span className="metakey">cmd</span>-x</span>cut</p>
        <p className="infoline"><span className="infohotkey"><span className="metakey">cmd</span>-v</span>paste</p>
        <p className="infoline"><span className="infohotkey"><span className="metakey">cmd</span>-z</span>undo</p>
        <p className="infoline"><span className="infohotkey"><span className="metakey">cmd</span>-z</span>redo</p>
        <p className="infoline"><span className="infohotkey"><span className="metakey">cmd</span>-s</span>save</p>
        <p className="infospacer"></p>
        <p className="infosubheader">In command or symbol editor:</p>
        <p className="infoline"><span className="infohotkey">enter</span>leave edit mode</p>
        <p className="infoline"><span className="infohotkey">escape</span>abort editing and restore previous value</p>
        <p className="infoline">Any of <span className="infohotkey">a-zA-Z0-9:-_&lt;&gt;=+-/*</span>can be used in names of commands or symbols.</p>
        <p className="infoline"><span className="infohotkey">delete</span>deletes previous character</p>
        <p className="infoline"><span className="infohotkey"><span className="optionkey">option</span>-space</span>autocomplete</p>
        <p className="infospacer"></p>
        <p className="infosubheader">In lambda editor:</p>
        <p className="infoline"><span className="infohotkey">enter</span>leave edit mode</p>
        <p className="infoline"><span className="infohotkey">escape</span>abort editing and restore previous value</p>
        <p className="infoline">Any of <span className="infohotkey">a-zA-Z0-9_-</span>can be used in names of function parameters. Spaces separate parameters. Parameter name proper cannot start or end with  <span className="infohotkey">_</span> (see syntax below)</p>
        <p className="infoline"><span className="infohotkey">delete</span>deletes previous character</p>
        <p className="infospacer"></p>
        <p className="infosubheader">lambda function parameter syntax:</p>
        <p className="infoline"><span className="infohotkey">n!</span>n must evaluate to a boolean</p>
        <p className="infoline"><span className="infohotkey">n@</span>n must evaluate to a symbol</p>
        <p className="infoline"><span className="infohotkey">n#</span>n must evaluate to an integer</p>
        <p className="infoline"><span className="infohotkey">n$</span>n must evaluate to a string</p>
        <p className="infoline"><span className="infohotkey">n%</span>n must evaluate to a float</p>
        <p className="infoline"><span className="infohotkey">n^</span>n must evaluate to a nil</p>
        <p className="infoline"><span className="infohotkey">n&</span>n must evaluate to a closure</p>
        <p className="infoline"><span className="infohotkey">n*</span>n must evaluate to a deferred value or command</p>
        <p className="infoline"><span className="infohotkey">n()</span>n must evaluate to some kind of container</p>
        <p className="infoline"><span className="infohotkey">n_</span>n must evaluate to a wavetable</p>
        <p className="infoline"><span className="infohotkey">_n</span>n will not be evaluated before passing to function (call by reference)</p>
        <p className="infoline"><span className="infohotkey">n...</span>variable number of arguments (only valid as last parameter)</p>
        <p className="infoline"><span className="infohotkey">?</span>optional parameter (non-optional parameters cannot follow optional ones)</p>
        <p className="infoline">Multiple parameter specifiers can be combined, for example <span className="infohotkey">_n#%...</span>,<span className="infohotkey">n()?</span></p>
        <p className="infoline"><span className="infohotkey">%#</span>either float or integer types allowed, others are not allowed (any type codes can be combined)</p>
        <p className="infoline">If no type is specified, any type is allowed.</p>
        <p className="infospacer"></p>
        <p className="infosubheader">In tag editor:</p>
        <p className="infolinemargin">Any object can be tagged. Any character including spaces can be used in a tag.</p>
        <p className="infoline"><span className="infohotkey">delete</span>deletes previous character, or current tag if empty.</p>
        <p className="infoline"><span className="infohotkey">leftarrow</span>or <span className="infohotkey">rightarrow</span>go to next tag, or create new tag if no tag there (duplicate tags are deleted).</p>
        <p className="infoline"><span className="infohotkey">enter</span>or <span className="infohotkey">`</span>finish editing tags and quit tag editor (empty tags are deleted when leaving editor).</p>
        <p className="infospacer"></p>
        <p className="infosubheader">In string editor:</p>
        <p className="infoline">Type or paste the desired string in the box. Drag the handle to make the editor larger. All other hotkeys are disabled while you are editing the string. To finish editing the string, click the "done" button.</p>
    </div>
  );
};

export default BasicUsagePanel;
