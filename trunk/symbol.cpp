#include "Carin.h"
#include "Symbol.h"
#include "StorageManager.h"

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
