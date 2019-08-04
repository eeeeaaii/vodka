#pragma once
#include "p_exp.h"

unsigned int eventThreadStartup(void *args);

namespace whelk {
	class Expression;
	class GraphicsContext;
	class Event;
	class EventHandler;
	class EvalException;
	class EventSubject;
	class ThingHolder  
	{
	private:
		sPtr top;
		sPtr selected;
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
		void setTop(sPtr newtop);
		sPtr getTop();
		void evaltop();
		EvalException *getError();
		void setupHandler(EventHandler *eh);
		void setupHandlers();
	};
}

