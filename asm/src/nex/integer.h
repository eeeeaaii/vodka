#ifndef VODKA_ASM_INTEGER
#define VODKA_ASM_INTEGER

#include "nex.h"

class Integer : public Nex {
private:
  int val_;

public:
  Integer(int runtime_id) : Nex(runtime_id){};
  void Init(int val) { val_ = val; }
  int get_value() { return val_; }
  void set_value(int val) { val_ = val; }

  void PrintName() { printf("integer\n"); }
};

#endif