#include "carin.h"
#include "real.h"

Real::Real()
{
	type = XT_REAL;
	setValue(0);
}

Real::Real(double n)
{
	type = XT_REAL;
	setValue(n);
}

Real::Real(int n)
{
	type = XT_REAL;
	setValue(double(n));
}

Real::Real(const string numstr)
{
	type = XT_REAL;
	if (checkValid(numstr)) {
		mytext = numstr;
	} else assert(false);
}

Real::~Real(void)
{
}

double Real::getRealRep()
{
	return value;
}

sPtr Real::promote()
{
	return GSM.newReal(value);
}

sPtr Real::newobj() 
{
   return GSM.createExp(new Real()); 
}

sPtr Real::copystate(sPtr n) 
{
	((Real*)n)->value = value;
	return Number::copystate(n);
}

void Real::setValue(double d)
{
	ostringstream s;
	s << d;
	mytext = s.str();
}

bool Real::checkValid(string s)
{
	assert(false);
	return false;
}
