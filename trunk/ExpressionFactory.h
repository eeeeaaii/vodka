#pragma once
#include "pExp.h"

namespace carin 
{
	class Environment;

	class ExpressionFactory
	{
	private:
		bool isLegalSymbol(string mytext);
		bool isLegalSymbolChar(char c);
		bool isLegalSymbolFirstChar(char c);
	public:
		ExpressionFactory();
		virtual ~ExpressionFactory();

		sPtr create(string mytext, Environment *newenv);
		int determineType(string);
		int determineType(sPtr p);
	};
}



