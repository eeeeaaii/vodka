#include <stdio.h>
#include "nex.h"
#include "memory.h"

int main() {
	printf("hello world\n");
}


Memory* memory = new Memory();

extern "C" {
	void evaluate() {
	}

	// returns runtime ID
	int create_integer(int intval) {
		printf("MAIN: create_integer intval=%d\n", intval);
		int rval = memory->create_integer(intval);
		printf("MAIN: new nex runtime_id=%d\n", rval);
		return rval;
	}

	void set_integer_value(int runtime_id, int intval) {
		printf("MAIN: set_integer_value %d %d\n", runtime_id, intval);
		Nex* nex = memory->get_at_memory(runtime_id);
		if (Integer* integer = dynamic_cast<Integer*>(nex)) {
			integer->set_value(intval);
		} else {
			printf("wrong set type, not integer %d %d \n", runtime_id, intval);
		}
	}

	int get_integer_value(int runtime_id) {
		printf("MAIN: get_integer_value %d\n", runtime_id);
		Nex* nex = memory->get_at_memory(runtime_id);
		if (Integer* integer = dynamic_cast<Integer*>(nex)) {
			return integer->get_value();
		} else {
			printf("wrong get type, not integer \n");
			return 0;
		}
	}
}
