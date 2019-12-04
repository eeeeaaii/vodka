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

#pragma once
#include "p_exp.h"
#include "code.h"
#include <string>
#include <vector>

using namespace std;

namespace whelk {
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
		sPointer<Code> 			eventinfo;
		static int 		firstid;

	public:
		Event();
		virtual ~Event();
		void 	initEventInfo();
		sPointer<Code> 	getEventInfo();
		int     getKeyvalue();
		int 	getType();
		int 	getID();
	};
}

