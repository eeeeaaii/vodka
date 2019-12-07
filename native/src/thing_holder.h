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

