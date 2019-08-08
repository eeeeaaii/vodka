#pragma once
#include "p_exp.h"
#include "simple_defines.h"
#include "expression.h"
#include "graphics_context.h"
#include <sstream>

namespace whelk {
	class Pair :
		public Expression
	{
	public:
		static int cdrmarg;
		static int boxmarg;

		sPointer<Expression> car;
		sPointer<Expression> cdr;
		void setCar(sPointer<Expression> nc);
		void setCdr(sPointer<Expression> nc);
		sPointer<Expression> getCar();
		sPointer<Expression> getCdr();
		virtual sPointer<Expression> newobj();
		virtual sPointer<Expression> copystate(sPointer<Expression> n);
		
		bool imagepair;
		bool collapsed;
		Direction direction;
		sPointer<Expression> cachedchild;

		Direction getDirection();
		void setDirection(Direction d);
		virtual Delta draw(GraphicsContext *gc);
		int getHeight(GraphicsContext *grcon);
		int getWidth(GraphicsContext *grcon);
		sPointer<Expression> getCachedChild();
		void setCachedChild(sPointer<Expression>);
		void setImagepair(bool b);

		string toString(bool isFirst = false);
		Pair(sPointer<Expression> ncar, sPointer<Expression> ncdr);
		Pair(void);
		~Pair(void);
	};
};

