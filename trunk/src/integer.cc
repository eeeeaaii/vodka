#include "integer.h"
#include "storage_allocator.h"
#include "expression.h"
#include <sstream>

using namespace whelk;
using namespace std;

Integer::Integer()
{
	type = XT_INTEGER;
	value = 0;
	mytext = string("0");
}

Integer::Integer(int n)
{
	type = XT_INTEGER;
	value = n;
	ostringstream outs;
	outs << n;
	mytext = outs.str();
}

 /* Integer(string)
  *
  * by this point we have already verified that
  * the string in "numstring" is a correctly
  * formatted integer -- all that logic is encapsulated
  * in the factory object.  So now we just need to
  * get the value of that int.
  */
Integer::Integer(string numstr)
{
	type = XT_INTEGER;
	mytext = numstr;
	istringstream is(numstr);
	is >> value;
}

Integer::~Integer()
{
}

int Integer::getIntRep()
{
	return value;
}

sPointer<Expression> Integer::promote()
{
	sPointer<Expression> p = GSA.newReal(value);
	return p;
}

sPointer<Expression> Integer::newobj()
{
	return GSA.createExp(new Integer()); 
}

sPointer<Expression> Integer::copystate(sPointer<Expression> n) {
	((Integer*)n)->value = value;
	return Number::copystate(n);
}


