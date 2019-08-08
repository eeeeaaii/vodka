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
