#include "carin.h"
#include "symbol.h"
#include "storage_manager.h"

Symbol::Symbol()
{
	type = XT_SYMBOL;
	setMytext("_");
}

Symbol::~Symbol()
{
}

Symbol::Symbol(string x)
{
	type = XT_SYMBOL;
	setMytext(x);
}
