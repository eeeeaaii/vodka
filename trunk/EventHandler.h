#pragma once
#include "EventObserver.h"
#include "pExp.h"

namespace carin {
	class Event;

	class EventHandler
		: public EventObserver
	{
	private:
		sPtr code;
	protected:
		sPtr exp;
	public:
		EventHandler();
		virtual ~EventHandler();

		virtual void notify(Event *e);
		void setCode(sPtr ncode);
		void setExpression(sPtr r);
		static int stringToTypeID(string s);
	};
}
