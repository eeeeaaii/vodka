#pragma once
#include "carin.h"
#include "expression.h"

namespace carin {
	class GraphicsContext;
	class Null :
		public Expression
	{
	public:
		// we have a value so we can use the same copyfrom macro for all types.
		void* value;
		Null(void);
		~Null(void);
		virtual Delta draw(GraphicsContext *gc);
		int getHeight(GraphicsContext *grcon);
		int getWidth(GraphicsContext *grcon);
		virtual sPtr newobj() { return GSM.createExp(new Null()); }
	};
};
