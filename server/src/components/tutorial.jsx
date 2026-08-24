import { useReducer, useEffect, useRef } from 'preact/hooks';

import { tutorialContent } from './tutorial_content';

import TutorialModule from './tutorial_module';
import TutorialMenu from './tutorial_menu'

import { startReactTutorial } from '../help';

                                      
/*
So there is some mechanism by which non-React code is going to
be able to tell this tutorial to show a given page or the next
page or whatever.
*/

function reducer(state, action) {
    switch(action.type) {
        case 'go-to-page': {
            state.stack.push(action.page);
            state.pagesSeen[action.page] = true;
            state.stackPosition++;
            state.currentPage = state.stack[state.stackPosition];
            state.panelOpen = true;
            return {...state};
        }
        case 'go-back': {
            state.stackPosition--;
            state.currentPage = state.stack[state.stackPosition];
            return {...state};
        }
        case 'go-forward': {
            state.stackPosition++;
            state.currentPage = state.stack[state.stackPosition];
            return {...state};
        }
        case 'close-panel': {
            console.log('closing again');
            state.panelOpen = false;
            return {...state};
        }
    }
}

const Tutorial = ({onEndTutorial}) => {
    const [ state, dispatch ] = useReducer(reducer, {
        stack: ['start-tutorial'],
        pagesSeen: {'start-tutorial': true},
        stackPosition: 0,
        currentPage: 'start-tutorial',
        panelOpen: true,
    }); // I could pass a third argument that inits the state.

    // The engine calls doTutorial() as the user does things; that arrives here.
    // Returns whether we actually showed a page, because some callers use that
    // to decide whether to offer a follow-up page.
    // seen is a ref, not state, because the callback registered below is held
    // by non-React code and would otherwise close over a stale copy.
    const seen = useRef(state.pagesSeen);
    const tutorialCallback = (page) => {
        if (seen.current[page]) {
            return false;
        }
        seen.current[page] = true;
        dispatch({ type: 'go-to-page', page });
        return true;
    }

    // Registering is a side effect, so it belongs in an effect rather than in
    // the render body, and it needs to be torn down if this unmounts.
    useEffect(() => {
        startReactTutorial(tutorialCallback);
    }, []);

    let canGoBack = state.stackPosition > 0;
    let canGoForward = state.stackPosition < state.stack.length - 1;

    const handleBack = () => {
        if (canGoBack) {
            dispatch({ type: 'go-back' });
        }
    }

    const handleForward = () => {
        if (canGoForward) {
            dispatch({ type: 'go-forward' });
        }
    }

    const handleClose = () => {
        console.log('closing');
        dispatch({ type: 'close-panel' })
    }


    return <div>
            {state.panelOpen ? (
                <TutorialModule
                content={tutorialContent[state.currentPage]}
                bottomMenu={
                    <TutorialMenu
                        onForward={canGoForward ? handleForward : null}
                        onBack={canGoBack ? handleBack : null}
                        onClose={handleClose}
                        onEnd={onEndTutorial}
                        />}
                />
            ) : (
                <></>
            )}
        </div>
    
};

export default Tutorial;
 