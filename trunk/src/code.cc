#include "code.h"

using namespace whelk;

int Code::nextID = 1;
	
Code::Code() {
	id = nextID++;
}

int Code::getID() {
	return id;
}

