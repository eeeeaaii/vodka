#include "Carin.h"
#include "Eventhandler.h"

#include "Event.h"
#include "Expression.h"
#include "Environment.h"
#include "StorageManager.h"
#include "Machine.h"
#include "Pair.h"

EventHandler::EventHandler()
{
}

EventHandler::~EventHandler()
{
}

void EventHandler::notify(Event *e)
{
	Environment *s = exp->getEnvironment();
	s->addBinding("*event-info*", e->getEventInfo());
	sPtr p = exp->getParent();
	Machine m;
	((Pair*)p)->setCar(m.eval(code, s));
}

void EventHandler::setExpression(sPtr r)
{
	exp = r;
}

void EventHandler::setCode(sPtr ncode)
{
	code = ncode;
}

int EventHandler::stringToTypeID(string newtype)
{
	if (newtype == "mouse-down") {
		return ET_MOUSEDOWN;
	} else if (newtype == "mouse-up") {
		return ET_MOUSEUP;
	} else if (newtype == "key-down") {
		return ET_KEYDOWN;
	} else if (newtype == "key-up") {
		return ET_KEYUP;
	} else if (newtype == "mouse-move") {
		return ET_MOUSEMOVE;
	} else if (newtype == "init") {
		return ET_INIT;
	} else if (newtype == "callback") {
		return ET_CALLBACK;
	} else if (newtype == "message") {
		return ET_MESSAGE;
	} else if (newtype == "tick") {
		return ET_TICK;
	} else if (newtype == "user") {
		return ET_USER;
	} else return ET_UNASSIGNED;
}
