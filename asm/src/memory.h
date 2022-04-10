#ifndef VODKA_ASM_MEMORY
#define VODKA_ASM_MEMORY

#include "nex/nex.h"
#include <stdio.h>

class Memory {
private:
  Nex *all_nexes[1000];
  int heap_top = 0;

public:
  template <class T> T *Create() {
    int runtime_id = heap_top;
    T *new_nex = new T(runtime_id);
    all_nexes[runtime_id] = new_nex;
    heap_top++;
    return new_nex;
  }

  template <class T> T *get(int runtime_id) {
    return (T *)all_nexes[runtime_id];
  }
};

#endif