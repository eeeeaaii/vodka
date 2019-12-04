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
#include "event_observer.h"
#include "event.h"
#include <list>

using namespace std;

namespace whelk 
{
	class EventSubject
	{
	private:
		list<EventObserver*> observers[11];

	public:
		EventSubject();
		virtual ~EventSubject();
		void subscribe(int type, EventObserver *eo);
		void unsubscribe(int type, EventObserver *eo);
		void notifyObservers(Event *e);
	};
}

extern whelk::EventSubject GES;
