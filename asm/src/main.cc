#include "environment.h"
#include "memory.h"
#include "nex/command.h"
#include "nex/integer.h"
#include <stdio.h>
#include <string>

using namespace std;

int main() {
  printf("webasm running\n");
  // do not do setup in this function because it always runs
  // regardless of whether or not we have the flag turned on
}

Memory *kMemory = new Memory();
Environment *kGlobalEnv = new Environment();

// because of the external C linkage, I have to declare all these here.
// if I don't do that then I have to have external/static/global variables
// and I get tangled dependencies. I am not going to use any kind of
// dependency injection so everything will be passed down in constructors
// from here.

extern "C" {
void SetupBuiltins() {}

int Evaluate(int runtime_id) {
  // I guess it would just return the runtime ID of the result.
  return 0;
}

int CreateInteger(int intval) {
  Integer *nex = kMemory->Create<Integer>();
  nex->Init(intval);
  return nex->get_runtime_id();
}

void set_integer_value(int runtime_id, int intval) {
  Integer *nex = kMemory->get<Integer>(runtime_id);
  nex->set_value(intval);
}

int get_integer_value(int runtime_id) {
  Integer *nex = kMemory->get<Integer>(runtime_id);
  return nex->get_value();
}

int CreateCommand(string intval) {
  Command *nex = kMemory->Create<Command>();
  nex->Init(intval);
  return nex->get_runtime_id();
}

void set_command_value(int runtime_id, string intval) {
  Command *nex = kMemory->get<Command>(runtime_id);
  nex->set_value(intval);
}

const char *get_command_value(int runtime_id) {
  Command *nex = kMemory->get<Command>(runtime_id);
  return nex->get_value().c_str();
}
}