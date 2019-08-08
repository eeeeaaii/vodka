#pragma once
#include "event.h"

namespace whelk 
{
	class EventObserver
	{
	public:
		EventObserver();
		virtual ~EventObserver();
		virtual void notify(Event *e) = 0;
	};
}

