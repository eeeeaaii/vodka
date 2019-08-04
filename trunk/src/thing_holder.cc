#include "whelk.h"
#include "thing_holder.h"

#include "expression.h"
#include "environment.h"
#include "storage_manager.h"
#include "event.h"
#include "graphics_context.h"
#include "pair.h"
#include "for_debugging.h"
#include "eval_exception.h"
#include "machine.h"
#include "event_handler.h"
#include "event_subject.h"


ThingHolder::ThingHolder()
{
	GSM.initTopLevelEnvironment();
	sPtr newtop = GSM.newPair(GSM.newExpression(), GSM.newNull());
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
	sPtr file = Expression::parseFromStream(f, end_of_file);
	top = GSM.newPair(file, GSM.newNull());
	file->setSelected(true);
	top->setIsTop(true);
}


void ThingHolder::setTop(sPtr newtop)
{
	top = newtop;
	top->setIsTop(true);
	if (top->isType(XT_PAIR)) {
		((Pair*)top)->getCar()->setSelected(true);
	}
}

sPtr ThingHolder::getTop()
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



