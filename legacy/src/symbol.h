#pragma once
#include "expression.h"

namespace whelk {
	class Symbol 
		: public Expression
	{
	public:
		Symbol();
		Symbol(string mytext);
		virtual ~Symbol();
	};
}
