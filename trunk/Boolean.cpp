#include "Carin.h"
#include "Boolean.h"

Boolean::Boolean(void)
{
	type = XT_BOOLEAN;
	setValue(false);
}

Boolean::Boolean(bool b)
{
	type = XT_BOOLEAN;
	setValue(b);
}

Boolean::Boolean(string val)
{
	type = XT_BOOLEAN;
	if (val == "#t") {
		setValue(true);
	} else if (val == "#T") {
		setValue(true);
	} else if (val == "#f") {
		setValue(false);
	} else if (val == "#F") {
		setValue(false);
	} else {
		assert(false);
	}
}

Boolean::~Boolean(void)
{
}

bool Boolean::getBoolRep()
{
	return value;
}

void Boolean::setBoolRep(bool b)
{
	value = b;
}

sPtr Boolean::newobj()
{
   return GSM.createExp(new Boolean()); 
}

sPtr Boolean::copystate(sPtr n)
{
   ((Boolean*)n)->value = value;
	return Expression::copystate(n);
}

void Boolean::setValue(bool b)
{
	value = b;
	mytext = b ? string("#t") : string("#f");
}

