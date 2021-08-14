#ifndef VODKA_ASM_MEMORY
#define VODKA_ASM_MEMORY

#include "nex.h"
#include "integer.h"
#include <stdio.h>

class Memory {
private:
	Nex* all_nexes[1000];
	int heap_top = 12;
public:
	int create_integer(int val) {
		int rval = heap_top;
		all_nexes[heap_top] = new Integer(val);
		heap_top++;
		printf("MEM: created new integer, runtime_id=%d value=%d\n", rval, val);
		return rval;
	}

	Nex* get_at_memory(int runtime_id) {
		return all_nexes[runtime_id];
	}
};

#endif