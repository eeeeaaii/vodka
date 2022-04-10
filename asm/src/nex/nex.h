#ifndef VODKA_ASM_NEX
#define VODKA_ASM_NEX

#include <stdio.h>

class Nex {
private:
  int runtime_id;

public:
  Nex(int _runtime_id) : runtime_id(_runtime_id) {}
  int get_runtime_id() { return runtime_id; }
  virtual void PrintName() = 0;
};

#endif