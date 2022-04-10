#ifndef VODKA_ASM_UNBOUND
#define VODKA_ASM_UNBOUND

#include "nex.h"

class Unbound : public Nex {
public:
  Unbound() : Nex(-1){};
  void PrintName() { printf("unbound\n"); }
};

#endif