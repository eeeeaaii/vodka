#include "Carin.h"
#include "Event.h"
#include "StorageManager.h"
#include "Rcmstring.h"


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
	switch(type) {
	case ET_KEYDOWN:
		{
			eventinfo = 
			GSM.newPair(
				GSM.newString(string("key-down"), false),
				GSM.newPair(
					GSM.newInteger(keyvalue),
					GSM.newPair(
						GSM.newChar(char(keyvalue)),
						GSM.newNull()
					)
				)
			);
			break;
		}
	case ET_KEYUP:
		{
			eventinfo = 
			GSM.newPair(
				GSM.newString(string("key-up"), false),
				GSM.newPair(
					GSM.newInteger(keyvalue),
					GSM.newPair(
						GSM.newChar(char(keyvalue)),
						GSM.newNull()
					)
				)
			);
			break;
		}
	case ET_MOUSEDOWN:
		{
			sPtr b;
			switch(button) {
				case MOUSE_UNASSIGNED:
					assert(false);
					break;
				case MOUSE_LEFTBUTTON:
					b = GSM.newString(string("left"), false);
					break;
				case MOUSE_RIGHTBUTTON:
					b = GSM.newString(string("right"), false);
					break;
				case MOUSE_MIDDLEBUTTON:
					b = GSM.newString(string("middle"), false);
					break;
			}
			GSM.newPair(
				GSM.newString(string("mousedown"), false),
				GSM.newPair(
					b,
					GSM.newPair(
						GSM.newPair(
							GSM.newInteger(x),
							GSM.newPair(
								GSM.newInteger(y),
								GSM.newNull()
							)
						),
						GSM.newNull()
					)
				)
			);
			break;
		}
	default:
		assert(false);
	}

}

sPtr Event::getEventInfo()
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
