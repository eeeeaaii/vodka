#include "thing_holder.h"
#include "expression.h"
#include "environment.h"
#include "storage_allocator.h"
#include "event.h"
#include "graphics_context.h"
#include "pair.h"
#include "for_debugging.h"
#include "eval_exception.h"
#include "machine.h"
#include "event_handler.h"
#include "event_subject.h"
#include "ide_event_handler.h"
#include <sstream>
#include <fstream>
#include <string>

using namespace whelk;

ThingHolder::ThingHolder()
{
	GSA.initTopLevelEnvironment();
	sPointer<Expression> newtop = GSA.newPair(GSA.newExpression(), GSA.newNull());
	setTop(newtop);
	topError = 0;
	dispatcher = new EventSubject();
}

ThingHolder::~ThingHolder()
{
	delete dispatcher;
}

void ThingHolder::dumpTree()
{
	top->dumpTree(0);
}

unsigned int eventThreadStartup(void *argsvp)
{
	void **args;
	args = (void**) argsvp;
	ThingHolder *th = (ThingHolder*)args[0];
	Event *ev = (Event*)args[1];
	return th->handleEvent(ev);
	delete args;
	delete ev;
}

void ThingHolder::draw(GraphicsContext *gracon)
{
	Point p(0, 0);
	gracon->pushOrigin(p);
	dbg.trace("---------------------\n");
	dbg.trace("drawing\n");
	top->draw(gracon);
	top->dumpTree(0);
}

int ThingHolder::handleEvent(Event *e)
{
	dbg.trace("-------------------------\n");
	dbg.trace("handling event");
	dbg.trace(e->getID());
	dbg.trace("\n");
	dispatcher->notifyObservers(e);
	return 0;
}

void ThingHolder::init()
{
}

void ThingHolder::save(string filename)
{
	ofstream f(filename.c_str());
	string s = top->toString(top->isType(XT_PAIR));
	f << s;
	f.flush();
	f.close();
}

void ThingHolder::load(string filename)
{
	fstream f(filename.c_str());
	bool end_of_file = false;
	sPointer<Expression> file = Expression::parseFromStream(f, end_of_file);
	top = GSA.newPair(file, GSA.newNull());
	file->setSelected(true);
	top->setIsTop(true);
}


void ThingHolder::setTop(sPointer<Expression> newtop)
{
	top = newtop;
	top->setIsTop(true);
	if (top->isType(XT_PAIR)) {
		((Pair*)top)->getCar()->setSelected(true);
	}
}

sPointer<Expression> ThingHolder::getTop()
{
	return top;
}

void ThingHolder::evaltop()
{
	try {
		Machine m;
		m.setup(top);
		m.process();
		top = m.result();
	} catch (EvalException *ee) {
		topError = ee;
	}
}

EvalException *ThingHolder::getError()
{
	EvalException *r;
	r = topError;
	topError = 0;
	return r;
}

void ThingHolder::setupHandler(EventHandler *eh)
{
	idehandlers.push_back(eh);
	dispatcher->subscribe(ET_KEYDOWN, eh);
}

void ThingHolder::setupHandlers()
{
	sPointer<Expression> sel;
	sel = ((Pair*)top)->getCar();
	setupHandler(new IDEHandler::IDECreateNextSiblingHandler(sel));
	setupHandler(new IDEHandler::IDECreateNextSiblingHandler(sel));
	setupHandler(new IDEHandler::IDECreatePreviousSiblingHandler(sel));
	setupHandler(new IDEHandler::IDEMoveNextSiblingHandler(sel));
	setupHandler(new IDEHandler::IDEMovePreviousSiblingHandler(sel));
	setupHandler(new IDEHandler::IDEDisbandHandler(sel));
	setupHandler(new IDEHandler::IDEMoveOutHandler(sel));
	setupHandler(new IDEHandler::IDEEnlistHandler(sel));
	setupHandler(new IDEHandler::IDEMoveInHandler(sel));
	setupHandler(new IDEHandler::IDEEvalHandler(sel));
	setupHandler(new IDEHandler::IDEPivotHandler(sel));
	setupHandler(new IDEHandler::IDEDeleteNodeHandler(sel));
	setupHandler(new IDEHandler::IDEKeyTypedHandler(sel));
	setupHandler(new IDEHandler::IDERuboutHandler(sel));
}




