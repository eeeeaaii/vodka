#pragma once
#include "p_exp.h"
#include "environment.h"
#include "expression.h"

namespace whelk 
{
	class ExpressionFactory
	{
	private:
		bool isLegalSymbol(string mytext);
		bool isLegalSymbolChar(char c);
		bool isLegalSymbolFirstChar(char c);
	public:
		ExpressionFactory();
		virtual ~ExpressionFactory();

		sPointer<Expression> create(string mytext, Environment *newenv);
		int determineType(string);
		int determineType(sPointer<Expression> p);
	};
}



