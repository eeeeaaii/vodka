#pragma once
#include "p_exp.h"
#include "code.h"
#include "expression.h"
#include "event_handler.h"
#include "event.h"


#define IDE_HANDLER_DECLARATION(X)\
class X : public IDEEventHandler\
{\
public:\
	X(sPointer<Expression> p) { exp = p; };\
	virtual void notify(Event *e);\
};\


namespace whelk {
	namespace IDEHandler {
		class IDEEventHandler 
			: public EventHandler
		{
		public:
			void swapSelected(sPointer<Expression> a, sPointer<Expression> b);
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
	virtual sPointer<Expression> handle(Event *e);\
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
			virtual sPointer<Expression> handle(Event *e) = 0;
			sPointer<Expression> findSelectedChild(sPointer<Expression> p);
			void swapSelected(sPointer<Expression> a, sPointer<Expression> b);
			static IDEEventHandler* initializeHandlerList(sPointer<Expression> exp);
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
