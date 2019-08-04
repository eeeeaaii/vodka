#pragma once
#include "whelk.h"

namespace whelk 
{
	class Event;
	class EventObserver
	{
	public:
		EventObserver();
		virtual ~EventObserver();
		virtual void notify(Event *e) = 0;
	};
}

