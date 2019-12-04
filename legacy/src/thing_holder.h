#pragma once
#include "p_exp.h"
#include "expression.h"
#include "eval_exception.h"
#include "event.h"
#include "event_handler.h"
#include "event_subject.h"
#include "graphics_context.h"

unsigned int eventThreadStartup(void *args);

namespace whelk {
	class ThingHolder  
	{
	private:
		sPointer<Expression> top;
		sPointer<Expression> selected;
		EvalException *topError;
		vector<EventHandler*> idehandlers;
		EventSubject *dispatcher;


	public:
		ThingHolder();
		virtual ~ThingHolder();

		int handleEvent(Event *event);
		void dumpTree();
		void save(string filename);
		void load(string filename);
		void draw(GraphicsContext *gracon);
		void init();
		void setTop(sPointer<Expression> newtop);
		sPointer<Expression> getTop();
		void evaltop();
		EvalException *getError();
		void setupHandler(EventHandler *eh);
		void setupHandlers();
	};
}

