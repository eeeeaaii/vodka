#pragma once
#include "pExp.h"

namespace carin {
	/* class Event
	 * This class encapsulates an event.
	 *
	 * members:
	 * properties:
	 * - keyvalue
	 *   This stores the key that was typed when the user presses a key
	 *   on the keyboard.  If < 1000, it's the ASCII char code of the key
	 *   (e.g. A=65).  If >= 1000, it's a special key (such as SHIFT, CTRL,
	 *   etc).
	 * - x
	 * - y
	 *   tracks position of x, y for mousemove, mousedown, and mouseup
	 * - button
	 *   indicates which mouse button was pressed on mousedown or mouseup
	 * - ticks
	 *   for timer events, indicates which tick of the timer we are responding
	 *   to
	 * - systemtime
	 *   also used with timer events
	 * - message
	 *   a string used for message events
	 * - user
	 *   a string used for user-defined events
	 * - firstid
	 *   this is the static id veriable that assigns new ID's for each thing.
	 */
	class Event  
	{
	//private:
	public:
		bool 			handled;
		int 			id;
		int 			type;
		int 			keyvalue;
		int 			x;
		int 			y;
		int 			button;
		int 			ticks;
		int 			systemtime;
		int 			shiftDown;
		int 			ctrlDown;
		int 			altDown;
		string 			message;
		string 			user;
		vector<string> 	args;
		sPtr 			eventinfo;
		static int 		firstid;

	public:
		Event();
		virtual ~Event();
		void 	initEventInfo();
		sPtr 	getEventInfo();
		int     getKeyvalue();
		int 	getType();
		int 	getID();
	};
}

