#pragma once
#include "p_exp.h"
#include "expression.h"

namespace whelk {

	class Number :
		public Expression
	{
	public:
		Number(void);
		virtual ~Number(void);
		virtual sPointer<Expression> promote() = 0;
	};
};

