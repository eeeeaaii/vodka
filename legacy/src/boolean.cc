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

#include "boolean.h"
#include "p_exp.h"
#include "expression.h"
#include "storage_allocator.h"

using namespace whelk;

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

sPointer<Expression> Boolean::newobj()
{
   return GSA.createExp(new Boolean()); 
}

sPointer<Expression> Boolean::copystate(sPointer<Expression> n)
{
   ((Boolean*)n.getP())->value = value;
	return Expression::copystate(n);
}

void Boolean::setValue(bool b)
{
	value = b;
	mytext = b ? string("#t") : string("#f");
}

