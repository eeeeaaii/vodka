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
