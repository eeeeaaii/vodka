// Copyright 2003-2005, 2008, 2019 Jason Scherer
/*
This file is part of Vodka.

Vodka is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vodka is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
*/

#include "event_subject.h"
#include "event_observer.h"
#include "event.h"
#include <list>

using namespace whelk;
using namespace std;

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
