#pragma once
#include "event_observer.h"
#include "p_exp.h"
#include "event.h"
#include "code.h"
#include "expression.h"

namespace whelk {

	class EventHandler
		: public EventObserver
	{
	private:
		sPointer<Expression> code;
	protected:
		sPointer<Expression> exp;
	public:
		EventHandler();
		virtual ~EventHandler();

		virtual void notify(Event *e);
		void setCode(sPointer<Expression> ncode);
		void setExpression(sPointer<Expression> r);
		static int stringToTypeID(string s);
	};
}
