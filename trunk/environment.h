#pragma once
#include "p_exp.h"

namespace carin {
	class Expression;

	class Environment  
	{
	private:
		class Binding;
		int references;
		Environment *parentEnv;
		vector<Environment::Binding> bindings;
		sPtr findBindingRecursive(string name);

	public:
		Environment();
		Environment(Environment *next);
		virtual ~Environment();

		sPtr lookupBinding(string name);
		void addBinding(string name, sPtr value);
		bool changeBinding(string name, sPtr value);
		void addRef();
		void removeRef();
		void debugBindings(int level = 0);
		void setParent(Environment *env);
		Environment *getParent();
	};

	class Environment::Binding {
	public:
		Binding(string _name, sPtr _value);
		Binding(const Binding& rhs);
		Binding& operator=(const Binding& rhs);
		string name;
		sPtr value;
	};
}
