#pragma once
#include "simple_defines.h"
#include "expression.h"
#include "p_exp.h"
#include <sstream>

namespace carin {
	class Pair :
		public Expression
	{
	public:
		static int cdrmarg;
		static int boxmarg;

		sPtr car;
		sPtr cdr;
		void setCar(sPtr nc);
		void setCdr(sPtr nc);
		sPtr getCar();
		sPtr getCdr();
		virtual sPtr newobj() { return GSM.createExp(new Pair()); }
		virtual sPtr copystate(sPtr n);
		
		bool imagepair;
		bool collapsed;
		Direction direction;
		sPtr cachedchild;

		Direction getDirection();
		void setDirection(Direction d);
		virtual Delta draw(GraphicsContext *gc);
		int getHeight(GraphicsContext *grcon);
		int getWidth(GraphicsContext *grcon);
		sPtr getCachedChild();
		void setCachedChild(sPtr);
		void setImagepair(bool b);

		string toString(bool isFirst = false);
		Pair(sPtr ncar, sPtr ncdr);
		Pair(void);
		~Pair(void);
	};
};

