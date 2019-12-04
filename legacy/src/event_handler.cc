// Copyright 2003-2005, 2008, Jason Scherer
// Copyright 2019 Google, Inc.
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

#include "event_handler.h"

#include "event.h"
#include "expression.h"
#include "environment.h"
#include "storage_manager.h"
#include "machine.h"
#include "pair.h"

using namespace whelk;


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
	sPointer<Expression> p = exp->getParent();
	Machine m;
	((Pair*)p)->setCar(m.eval(code, s));
}

void EventHandler::setExpression(sPointer<Expression> r)
{
	exp = r;
}

void EventHandler::setCode(sPointer<Expression> ncode)
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
