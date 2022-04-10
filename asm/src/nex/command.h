#ifndef VODKA_ASM_COMMAND
#define VODKA_ASM_COMMAND

#include "nexcontainer.h"
#include <string>

using namespace std;

class Command : public NexContainer {
private:
  string commandtext_;

public:
  Command(int runtime_id) : NexContainer(runtime_id){};
  void Init(string commandtext) { commandtext_ = commandtext; }
  string &get_value() { return commandtext_; }
  void set_value(string commandtext) { commandtext_ = commandtext; }

  void PrintName() { printf("Command\n"); }
};

#endif