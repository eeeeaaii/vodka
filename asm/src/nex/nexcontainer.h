#ifndef VODKA_ASM_NEXCONTAINER
#define VODKA_ASM_NEXCONTAINER

#include "nex.h"
#include <vector>

using namespace std;

class NexContainer : public Nex {
private:
  vector<Nex *> children_;

public:
  NexContainer(int runtime_id) : Nex(runtime_id){};

  void PrintTypeName() { printf("NexContainer\n"); }
};

#endif