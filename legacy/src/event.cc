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

#include "event.h"
#include "storage_allocator.h"
#include "whelk_string.h"
#include "expression.h"

using namespace whelk;

Event::Event()
{
	type = ET_UNASSIGNED;
	handled = 0;
	keyvalue = ' ';
	x = 0;
	y = 0;
	message = "";
	user = "";
	ticks = 0;
	systemtime = 0;
	button = MOUSE_UNASSIGNED;
	shiftDown = 0;
	ctrlDown = 0;
	altDown = 0;
	id = firstid++;
}

Event::~Event()
{
}

void Event::initEventInfo()
{
	sPointer<Expression> tmpEventInfo;

	switch(type) {
	case ET_KEYDOWN:
		{
			tmpEventInfo = 
			GSA.newPair(
				GSA.newString(string("key-down"), false),
				GSA.newPair(
					GSA.newInteger(keyvalue),
					GSA.newPair(
						GSA.newChar(char(keyvalue)),
						GSA.newNull()
					)
				)
			);
			break;
		}
	case ET_KEYUP:
		{
			tmpEventInfo = 
			GSA.newPair(
				GSA.newString(string("key-up"), false),
				GSA.newPair(
					GSA.newInteger(keyvalue),
					GSA.newPair(
						GSA.newChar(char(keyvalue)),
						GSA.newNull()
					)
				)
			);
			break;
		}
	case ET_MOUSEDOWN:
		{
			sPointer<Expression> b;
			switch(button) {
				case MOUSE_UNASSIGNED:
					assert(false);
					break;
				case MOUSE_LEFTBUTTON:
					b = GSA.newString(string("left"), false);
					break;
				case MOUSE_RIGHTBUTTON:
					b = GSA.newString(string("right"), false);
					break;
				case MOUSE_MIDDLEBUTTON:
					b = GSA.newString(string("middle"), false);
					break;
			}
			tmpEventInfo = 
			GSA.newPair(
				GSA.newString(string("mousedown"), false),
				GSA.newPair(
					b,
					GSA.newPair(
						GSA.newPair(
							GSA.newInteger(x),
							GSA.newPair(
								GSA.newInteger(y),
								GSA.newNull()
							)
						),
						GSA.newNull()
					)
				)
			);
			break;
		}
	default:
		assert(false);
	}
	Expression* e = tmpEventInfo.getP();
	Code* c = (Code*)e;
	eventinfo = c;
//	return c;
//	return sPointer<Code>(c);

}

sPointer<Code> Event::getEventInfo()
{
	return eventinfo;
}

int Event::getType()
{
	return type;
}

int Event::getID()
{
	return id;
}

int Event::getKeyvalue()
{
	return keyvalue;
}

int Event::firstid = 0;
