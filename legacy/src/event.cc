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
