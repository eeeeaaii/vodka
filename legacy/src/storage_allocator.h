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

#pragma once

#include "p_exp.h"
#include "for_debugging.h"
#include "environment.h"
#include "bitmap.h"
#include "expression.h"
#include "storage_manager.h"

#define COPY_BYTYPE(CLASSNAME) \
		{\
			CLASSNAME *newp;\
			newp = new CLASSNAME();\
			sPointer<Expression> r(newp);\
			GSM.addRef(newp);\
			(*newp) = (*(CLASSNAME*)copyfrom);\
			return r;\
		}\

#define WHELK_BIND(x, y) global->addBinding((x), (Code*)GSA.newProcedureSubtype(new (y)()).getP());

// TODO: separate this into two objects: a storage manager (reference counter)
// and a storage allocator. The allocator creates things and hands them off
// to the manager. sPointer can depend on the manager because it needs to
// automatically increment and decrement pointers and free them in its copy constructors etc,
// but it doesn't need to depend on storage allocator because it doesn't allocate things.
// then I can inline all the template functions in sPointer

namespace whelk {

	class StorageAllocator
	{
	public:
		StorageAllocator();
		virtual ~StorageAllocator();
		
		Environment *global;
		Environment *getGlobalEnvironment();

		template <class T> sPointer<Expression> createExp(T *newp) {
			sPointer<Expression> r((Expression*)newp);
			GSM.addRef(newp);
			dbg.trace("T %d has come into being\n");
			dbg.trace(newp->getID());
			dbg.trace("\n");
			return r;
		}

		sPointer<Expression> newExpression();
		sPointer<Expression> newExpression(string mytext);
		sPointer<Expression> newExpression(Expression *copyfrom);
		sPointer<Expression> newPair(sPointer<Expression> car, sPointer<Expression> cdr);
		sPointer<Expression> newNull();
		sPointer<Expression> newInteger(int num);
		sPointer<Expression> newInteger(string numstr);
		sPointer<Expression> newReal(double num);
		sPointer<Expression> newReal(string numstr);
		sPointer<Expression> newReal(int num);
		sPointer<Expression> newImage(Bitmap *b);
		sPointer<Expression> newString(string str, bool dec);
		sPointer<Expression> newProcedure(sPointer<Expression> code);
		sPointer<Expression> newProcedureSubtype(Expression *f);
		sPointer<Expression> newBoolean(bool val);
		sPointer<Expression> newBoolean(string val);
		sPointer<Expression> newSymbol(string mytext);
		sPointer<Expression> newChar(string x);
		sPointer<Expression> newChar(char x);
		sPointer<Expression> newFileInputPort(string s);
		sPointer<Expression> newFileOutputPort(string s);
		sPointer<Expression> newClientPort(string host, int port);
		sPointer<Expression> newServerPort(int port);

		sPointer<Expression> newByType(int type, void* copyfrom);

		void initTopLevelEnvironment();
		void initBuiltins();
		void initBuiltins2();
		void initLibraries();
		void loadLibrary(char *libname);
	};
};

extern whelk::StorageAllocator GSA;
