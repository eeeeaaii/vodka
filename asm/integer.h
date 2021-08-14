#ifndef VODKA_ASM_INTEGER
#define VODKA_ASM_INTEGER

#include "nex.h"

class Integer : public Nex {
private:
	int val;
public:
	Integer(int v): val(v) {};
	int get_value() { return val; }
	void set_value(int value) { val = value; }

	void print_type_name() {
		printf("integer\n");
	}
};

#endif