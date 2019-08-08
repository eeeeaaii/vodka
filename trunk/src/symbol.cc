#include "symbol.h"
#include "storage_manager.h"
#include <string>

using namespace whelk;
using namespace std;

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
