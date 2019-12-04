// Copyright 2003-2005, 2008, 2019 Jason Scherer
/*
This file is part of Vodka.

Vodka is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vodka is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
*/

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


