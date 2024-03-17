import React, { useState, useReducer } from 'react';

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

    const tutorialCallback = (page) => {
        if (!state.pagesSeen[page]) {
            dispatch({ type: 'go-to-page', page })
        }
    }
    startReactTutorial(tutorialCallback);

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
 