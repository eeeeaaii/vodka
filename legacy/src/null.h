#pragma once
#include "p_exp.h"
#include "expression.h"
#include "graphics_context.h"

namespace whelk {
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
		virtual sPointer<Expression> newobj();
	};
};
