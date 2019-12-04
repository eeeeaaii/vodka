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

#include "environment.h"
#include "storage_manager.h"
#include "procedure.h"
#include "for_debugging.h"
#include "expression.h"
#include <sstream>

using namespace whelk;
using namespace std;


Environment::Environment()
{
	parentEnv = 0;
	references = 0;
}

Environment::Environment(Environment *p)
{
	parentEnv = p;
	references = 0;
}


Environment::~Environment()
{
}

void Environment::addRef()
{
	references++;
}

/*
 * it is ok for a member function to call "delete this"
 * however care must be taken to avoid certain types of
 * resulting problems.  for more info, see caveats in 
 * documentation file called deletethis.txt
 *
 */
void Environment::removeRef()
{
	references--;
	if (references == 0) {
		if (parentEnv) {
			parentEnv->removeRef();
		}
		delete this;
	}
}

sPointer<Code> Environment::lookupBinding(string _name)
{
	sPointer<Code> r = findBindingRecursive(_name);
	if (!r) {
		return r;
	} else {
		Code* c = r.getP();
		Expression* e = (Expression*)c;
		sPointer<Expression> duped = e->dupe();
		return duped.getP();
		//return c2;
//		return sPointer<Code>(c2);
	}
}

sPointer<Code> Environment::findBindingRecursive(string _name)
{
	sPointer<Code> r;
	vector<Environment::Binding>::iterator i;
	for (i = bindings.begin() ; i != bindings.end() ; i++) {
		if (i->name == _name) {
			r = i->value;
		}
	}
	if (!r && parentEnv) {
		r = parentEnv->lookupBinding(_name);

	}
	return r;
}

bool Environment::changeBinding(string _name, sPointer<Code> _value)
{
	sPointer<Code> r;
	vector<Environment::Binding>::iterator i;
	for (i = bindings.begin() ; i != bindings.end() ; i++) {
		if (i->name == _name) {
			sPointer<Code> oldvalue;
			oldvalue = i->value;
			i->value = _value;
			return !!oldvalue;
		}
	}
	// if you get here then we did not find it
	if (!parentEnv) return false;
	return parentEnv->changeBinding(_name, _value);
}


void Environment::addBinding(string _name, sPointer<Code> _value)
{
	bindings.push_back(Binding(_name, _value));
}

void Environment::debugBindings(int level)
{
	string x("Bind:");
	ostringstream o;
	o << level;
	x += o.str();
	x += ": ";
	vector<Environment::Binding>::iterator i;
	for (i = bindings.begin() ; i != bindings.end() ; i++) {
		string y = x;
		y += i->name;
		y += string("\n");
		dbg.trace(y);
	}
	if (parentEnv) {
		parentEnv->debugBindings(level + 1);
	}
}

void Environment::setParent(Environment *e)
{
	parentEnv = e;
}

Environment *Environment::getParent()
{
	return parentEnv;
}


// Environment::Binding

Environment::Binding::Binding(string _name, sPointer<Code> _value)
{
	name = _name;
	value = _value;
}

Environment::Binding::Binding(const Environment::Binding& rhs)
{
	name = rhs.name;
	value = rhs.value;
}

Environment::Binding& Environment::Binding::operator=(const Environment::Binding& rhs)
{
	name = rhs.name;
	value = rhs.value;
	return *this;
}

