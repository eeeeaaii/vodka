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

#include "real.h"
#include "storage_allocator.h"
#include <sstream>

using namespace whelk;

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

sPointer<Expression> Real::promote()
{
	return GSA.newReal(value);
}

sPointer<Expression> Real::newobj() 
{
   return GSA.createExp(new Real()); 
}

sPointer<Expression> Real::copystate(sPointer<Expression> n) 
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
