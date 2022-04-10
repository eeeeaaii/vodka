#ifndef VODKA_ASM_ENVIRONMENT
#define VODKA_ASM_ENVIRONMENT

#include "nex/nex.h"
#include "nex/unbound.h"
#include <map>
#include <string>
#include <vector>

using namespace std;

const string kBuiltinArgPrefix = string("|");
static Nex* kUnbound = new Unbound();

struct BindingRecord {
public:
  BindingRecord(string name, Nex *value, string package_name)
      : name_(name), value_(value), package_name_(package_name){};

  string name_;
  Nex *value_;
  string package_name_;
};

class Environment {
public:
  Environment() : parent_env_(nullptr) {}
  Environment(Environment *parent_env) : parent_env_(parent_env) {}

  Environment *get_parent() { return parent_env_; }

  Environment *PushEnv() {
    Environment *new_env = new Environment(this);
    return new_env;
  }

  void UsePackage(string package_name);

  void SetPackageToUseForBindings(string package_name);

  bool IsKnownPackageName(string package_name);

  void BindInCurrentPackage(string symbol_name, Nex *value);

  void Bind(string symbol_name, Nex *value, string package_name);

  vector<string> GetAllBoundSymbolsAtThisLevel();

  // special function for builtins, was called "lb"
  Nex* RetrieveArgument(string param_name);

  template<typename F>
  void DoForEachBinding(F f);


  //  BindingRecord LookupFullBinding(string name);
  //  Nex* LookupBinding(string name);

private:
  BindingRecord* RecursiveLookup(string name, vector<vector<string>> packages_used);

  Environment *parent_env_;
  map<string, BindingRecord *> symbols_;
  vector<string> list_of_packages_used_;
  vector<string> known_packages_;
  string current_package_for_binding_;
};

#endif