#pragma once
#include "Carin.h"
#include "Expression.h"

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
