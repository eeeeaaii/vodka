#include <string>
#include <algorithm>

#include "environment.h"
#include "nex/nex.h"

using namespace std;

void Environment::UsePackage(string package_name) {
	list_of_packages_used_.push_back(package_name);
}

void Environment::SetPackageToUseForBindings(string package_name) {
	known_packages_.push_back(package_name);
	current_package_for_binding_ = package_name;
}

bool Environment::IsKnownPackageName(string package_name) {
	return (std::find(known_packages_.begin(), known_packages_.end(), package_name) != known_packages_.end());
}

void Environment::BindInCurrentPackage(string symbol_name, Nex* value) {
	// in the js code I test for the erroneous inclusion of a ':' in the symbol name
	// and throw an error if one is there
	// but here I may be able to ensure we don't get incorrect inputs.

	string name_to_bind = symbol_name;
	if (current_package_for_binding_ != "") {
		name_to_bind = current_package_for_binding_ + symbol_name;
	}

	// TODO:
	// The js code had this snippet which I BELIEVE implements the following logic:
	//
	// if we are defining a package foo
	// and then inside that we have a USING statement so we are using package bar
	// and we are binding some name to a closure
	// we want that closure's lexical environment to be the current package that we defining (foo)
	// not the using package (bar)
	//
	// I think this has something to do with lexical scoping.
	/*
	if (val.getTypeName() == '-closure-' && !this.packageBeingUsed(this.currentPackageForBinding)) {
		val.getLexicalEnvironment().usePackage(this.currentPackageForBinding);
	}
	*/
	Bind(symbol_name, value, current_package_for_binding_);
}

void Environment::Bind(string symbol_name, Nex* value, string package_name) {
	BindingRecord* record = new BindingRecord(symbol_name, value, package_name);

	map<string, BindingRecord*>::iterator existing_record = symbols_.find(symbol_name);
	if (symbols_.find(symbol_name) != symbols_.end()) {
		delete symbols_[symbol_name];
	}
	symbols_[symbol_name] = record;

	// TODO:
	// if the value is a closure, I have to call setCmdName on it
	// for some reason or other
}

Nex* Environment::RetrieveArgument(string param_name) {
	string binding_name = kBuiltinArgPrefix + param_name;
	map<string, BindingRecord*>::iterator existing_record = symbols_.find(binding_name);
	if (existing_record == symbols_.end()) {
		return kUnbound;
	}
	return symbols_[binding_name]->value_;
}

vector<string> Environment::GetAllBoundSymbolsAtThisLevel() {
	// does not transfer ownership of pointers to the parent
	vector<string> bound_symbols;
	for (auto i = symbols_.begin(); i != symbols_.end(); ++i) {
		bound_symbols.push_back((*i).first);
	}
	return bound_symbols;
}

template<typename F>
void Environment::DoForEachBinding(F f) {
	for (auto i = symbols_.begin(); i != symbols_.end(); ++i) {
		f(*i);
	}
}

BindingRecord* Environment::RecursiveLookup(string name, vector<vector<string>> packages_used) {
	if (symbols_.find(name) != symbols_.end()) {
		return symbols_[name];
	}
	BindingRecord* binding = this.symbols[name];
}











/*

BindingRecord Environment::RecursiveLookup(string name) {
}

BindingRecord Environment::LookupFullBinding(string name) {
	size_t point_position = name.find('.');
	string dereferencing_part = string();
	if (point_position != string::npos) {
		// get the section of the string after the point
		dereferencing_part = name.substr(point_position + 1, name.length - point_position - 1);
	}
	BindingRecord binding = RecursiveLookup(name);
	if (!binding) {
		throw new EError(`undefined symbol: ${name}. Sorry!`);
	}
*/

/*


		binding.val.packageName = binding.packageName;
		if (dereferencingPart) {
			binding = this.copyBindingRecord(binding);
			binding.val = this.dereference(binding.val, dereferencingPart);
		}
		return binding;





	lookupFullBinding(string name) {






		let dereferencingPart = null;
		if (name.indexOf('.') >= 0) {
			dereferencingPart = name.substr(name.indexOf('.') + 1).split('.');
			name = name.substr(0, name.indexOf('.'));
		}
		let binding = this._recursiveLookup(name, [this.listOfPackagesUsed]);
		if (!binding) {
			throw new EError(`undefined symbol: ${name}. Sorry!`);
		}
		binding.val.packageName = binding.packageName;
		if (dereferencingPart) {
			binding = this.copyBindingRecord(binding);
			binding.val = this.dereference(binding.val, dereferencingPart);
		}
		return binding;
	}



}


Nex* Environment::LookupBinding(string name) {

}

*/