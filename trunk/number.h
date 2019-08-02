#pragma once
#include "expression.h"

namespace carin {

	class Number :
		public Expression
	{
	public:
		Number(void);
		virtual ~Number(void);
		virtual sPtr promote() = 0;
	};
};

