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

#pragma once
#include "p_exp.h"
#include "code.h"
#include <vector>
#include <string>

using namespace std;

namespace whelk {
	class Environment  
	{
	private:
		class Binding;
		int references;
		Environment *parentEnv;
		vector<Environment::Binding> bindings;
		sPointer<Code> findBindingRecursive(string name);

	public:
		Environment();
		Environment(Environment *next);
		virtual ~Environment();

		sPointer<Code> lookupBinding(string name);
		void addBinding(string name, sPointer<Code> value);
		bool changeBinding(string name, sPointer<Code> value);
		void addRef();
		void removeRef();
		void debugBindings(int level = 0);
		void setParent(Environment *env);
		Environment *getParent();
	};

	class Environment::Binding {
	public:
		Binding(string _name, sPointer<Code> _value);
		Binding(const Binding& rhs);
		Binding& operator=(const Binding& rhs);
		string name;
		sPointer<Code> value;
	};
}
