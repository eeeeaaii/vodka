#pragma once
#include "carin.h"
#include "expression.h"

namespace carin {
	class Symbol 
		: public Expression
	{
	public:
		Symbol();
		Symbol(string mytext);
		virtual ~Symbol();
	};
}
