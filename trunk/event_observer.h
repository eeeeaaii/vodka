#pragma once
#include "Carin.h"

namespace carin 
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

