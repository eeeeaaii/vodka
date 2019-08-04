#include "carin.h"
#include "event_subject.h"
#include "event_observer.h"
#include "event.h"


EventSubject::EventSubject()
{
	/*
const int ET_UNASSIGNED = 0;
const int ET_KEYDOWN = 1;
const int ET_KEYUP = 2;
const int ET_MOUSEMOVE = 3;
const int ET_MOUSEDOWN = 4;
const int ET_MOUSEUP = 5;
const int ET_INIT = 6;
const int ET_CALLBACK = 7;
const int ET_MESSAGE = 8;
const int ET_TICK = 9;
const int ET_USER = 10;
	 */
}

EventSubject::~EventSubject()
{
}

void EventSubject::subscribe(int eventtype, EventObserver *eo)
{
	observers[eventtype].push_front(eo);
}

void EventSubject::unsubscribe(int eventtype, EventObserver *eo)
{
	observers[eventtype].remove(eo);
}

void EventSubject::notifyObservers(Event *e)
{
	list<EventObserver*>::iterator i;
	for (i = observers[e->getType()].begin() ;
			i != observers[e->getType()].end() ;
			i++) {
		(*i)->notify(e);
	}
}
