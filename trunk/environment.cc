#include "carin.h"
#include "environment.h"

#include "storage_manager.h"
#include "procedure.h"
#include "for_debugging.h"


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

sPtr Environment::lookupBinding(string _name)
{
	sPtr r = findBindingRecursive(_name);
	if (!r) {
		return r;
	} else {
		return r->dupe();
	}
}

sPtr Environment::findBindingRecursive(string _name)
{
	sPtr r;
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

bool Environment::changeBinding(string _name, sPtr _value)
{
	sPtr r;
	vector<Environment::Binding>::iterator i;
	for (i = bindings.begin() ; i != bindings.end() ; i++) {
		if (i->name == _name) {
			sPtr oldvalue;
			oldvalue = i->value;
			i->value = _value;
			return !!oldvalue;
		}
	}
	// if you get here then we did not find it
	if (!parentEnv) return false;
	return parentEnv->changeBinding(_name, _value);
}


void Environment::addBinding(string _name, sPtr _value)
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

Environment::Binding::Binding(string _name, sPtr _value)
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

