#pragma once
#include "expression.h"

namespace whelk {

	class Number :
		public Expression
	{
	public:
		Number(void);
		virtual ~Number(void);
		virtual sPtr promote() = 0;
	};
};

