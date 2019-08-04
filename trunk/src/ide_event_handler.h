#pragma once
#include "event_handler.h"
#include "p_exp.h"


#define IDE_HANDLER_DECLARATION(X)\
class X : public IDEEventHandler\
{\
public:\
	X(sPtr p) { exp = p; };\
	virtual void notify(Event *e);\
};\


namespace whelk {
	namespace IDEHandler {
		class IDEEventHandler 
			: public EventHandler
		{
		public:
			void swapSelected(sPtr a, sPtr b);
		};
		IDE_HANDLER_DECLARATION(IDECreateNextSiblingHandler);
		IDE_HANDLER_DECLARATION(IDECreatePreviousSiblingHandler);
		IDE_HANDLER_DECLARATION(IDEMoveNextSiblingHandler);
		IDE_HANDLER_DECLARATION(IDEMovePreviousSiblingHandler);
		IDE_HANDLER_DECLARATION(IDEDisbandHandler);
		IDE_HANDLER_DECLARATION(IDEMoveOutHandler);
		IDE_HANDLER_DECLARATION(IDEEnlistHandler);
		IDE_HANDLER_DECLARATION(IDEMoveInHandler);
		IDE_HANDLER_DECLARATION(IDEEvalHandler);
		IDE_HANDLER_DECLARATION(IDEPivotHandler);
		IDE_HANDLER_DECLARATION(IDEDeleteNodeHandler);
		IDE_HANDLER_DECLARATION(IDEKeyTypedHandler);
		IDE_HANDLER_DECLARATION(IDERuboutHandler);
	}
}


/*
#define IDE_HANDLER_DECLARATION(X) \
\
class X : public IDEEventHandler \
{\
public:\
	virtual bool test(Event *e);\
	virtual sPtr handle(Event *e);\
	X(EventHandler *e) { next = e; }; \
};


namespace whelk {

	namespace IDEHandler {
		class IDEEventHandler : public EventHandler
		{
		public:
			IDEEventHandler(void);
			~IDEEventHandler(void);
			virtual bool test(Event *e) = 0;
			virtual sPtr handle(Event *e) = 0;
			sPtr findSelectedChild(sPtr p);
			void swapSelected(sPtr a, sPtr b);
			static IDEEventHandler* initializeHandlerList(sPtr exp);
		};

		IDE_HANDLER_DECLARATION(IDECreateNextSiblingHandler);
		IDE_HANDLER_DECLARATION(IDECreatePreviousSiblingHandler);
		IDE_HANDLER_DECLARATION(IDEMoveNextSiblingHandler);
		IDE_HANDLER_DECLARATION(IDEMovePreviousSiblingHandler);
		IDE_HANDLER_DECLARATION(IDEDisbandHandler);
		IDE_HANDLER_DECLARATION(IDEMoveOutHandler);
		IDE_HANDLER_DECLARATION(IDEEnlistHandler);
		IDE_HANDLER_DECLARATION(IDEMoveInHandler);
		IDE_HANDLER_DECLARATION(IDEEvalHandler);
		IDE_HANDLER_DECLARATION(IDEPivotHandler);
		IDE_HANDLER_DECLARATION(IDEDeleteNodeHandler);
		IDE_HANDLER_DECLARATION(IDEKeyTypedHandler);
		IDE_HANDLER_DECLARATION(IDERuboutHandler);
	}

}
*/
