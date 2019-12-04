// Copyright 2003-2005, 2008, Jason Scherer
// Copyright 2019 Google, Inc.
/*
This file is part of Vodka.

Vodka is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vodka is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
*/

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



