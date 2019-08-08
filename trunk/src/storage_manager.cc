#include "storage_manager.h"
#include "eval_exception.h"
#include "environment.h"
#include "expression.h"
#include "bitmap.h"
#include "integer.h"
#include "real.h"
#include "procedure.h"
#include "whelk_string.h"
#include "image.h"
#include "boolean.h"
#include "null.h"
#include "pair.h"
#include "for_debugging.h"
#include "char.h"
#include "port.h"
#include "net_port.h"
#include "symbol.h"
#include "machine.h"

whelk::StorageManager GSM;

using namespace whelk;

StorageManager::StorageManager()
{
	for (int i = 0 ; i < HEAPSIZE ; i++) {
		allreferences[i] = 0;
	}
}

StorageManager::~StorageManager()
{
}


void StorageManager::addRef(Code *t)
{
	// if it's a new ref, it should just be zero to start with.
	assert(t->getID() < HEAPSIZE);
	allreferences[t->getID()]++;
}

void StorageManager::removeRef(Code *t)
{
	allreferences[t->getID()]--;
	if (allreferences[t->getID()] == 0) {
		releaseRef(t);
	}
}

void StorageManager::releaseRef(Code *t)
{
	delete t;
}



