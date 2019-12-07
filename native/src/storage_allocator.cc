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
#include "storage_manager.h"

whelk::StorageAllocator GSA;

using namespace whelk;

StorageAllocator::StorageAllocator()
{
}

StorageAllocator::~StorageAllocator()
{

}

Environment *StorageAllocator::getGlobalEnvironment()
{
	return global;
}

sPointer<Expression> StorageAllocator::newExpression()
{
	return createExp(new Expression());
}

sPointer<Expression> StorageAllocator::newExpression(string mt)
{
	return createExp(new Expression(mt));
}

sPointer<Expression> StorageAllocator::newSymbol(string mt)
{
	return createExp(new Symbol(mt));
}

sPointer<Expression> StorageAllocator::newExpression(Expression *copyfrom)
{
	sPointer<Expression> newp = createExp(new Expression());
	(*newp) = (*copyfrom);
	sPointer<Expression> r(newp);
	return r;
}


sPointer<Expression> StorageAllocator::newPair(sPointer<Expression> ncar, sPointer<Expression> ncdr)
{
	return createExp(new Pair(ncar, ncdr));
}

sPointer<Expression> StorageAllocator::newImage(Bitmap *b)
{
	return createExp(new Image(b));
}
sPointer<Expression> StorageAllocator::newBoolean(bool val)
{
	return createExp(new Boolean(val));
}

sPointer<Expression> StorageAllocator::newBoolean(string val)
{
	return createExp(new Boolean(val));
}

sPointer<Expression> StorageAllocator::newByType(int type, void *copyfrom)
{
	
	switch(type) {
	case XT_BOOLEAN:
		COPY_BYTYPE(Boolean);
	case XT_INTEGER:
		COPY_BYTYPE(Integer);
	case XT_REAL:
		COPY_BYTYPE(Real);
	case XT_STRING:
		COPY_BYTYPE(String);
	case XT_CHAR:
		COPY_BYTYPE(Char);
	case XT_UNKNOWN:
		COPY_BYTYPE(Expression);
	case XT_NULL:
		COPY_BYTYPE(Null);
	case XT_PAIR:
		COPY_BYTYPE(Pair);
	case XT_PROCEDURE:
		COPY_BYTYPE(Procedure);
	}
	return 0;
}


sPointer<Expression> StorageAllocator::newNull()
{
	return createExp(new Null());
}



sPointer<Expression> StorageAllocator::newInteger(string numstr)
{
	return createExp(new Integer(numstr));
}

sPointer<Expression> StorageAllocator::newInteger(int num)
{
	return createExp(new Integer(num));	
}



sPointer<Expression> StorageAllocator::newReal(double num)
{
	return createExp(new Real(num));
}

sPointer<Expression> StorageAllocator::newReal(int num)
{
	return createExp(new Real(num));
}


sPointer<Expression> StorageAllocator::newReal(string numstr)
{
	return createExp(new Real(numstr));
}



sPointer<Expression> StorageAllocator::newString(string str, bool dec)
{
	return createExp(new String(str, dec));	
}

sPointer<Expression> StorageAllocator::newChar(string str)
{
	return createExp(new Char(str));	
}

sPointer<Expression> StorageAllocator::newChar(char c)
{
	return createExp(new Char(c));	
}

sPointer<Expression> StorageAllocator::newFileInputPort(string s)
{
	return createExp(new FileInputPort(s));	
}

sPointer<Expression> StorageAllocator::newFileOutputPort(string s)
{
	return createExp(new FileOutputPort(s));	
}

sPointer<Expression> StorageAllocator::newClientPort(string h, int port)
{
#ifdef WINDOWS
	return createExp(new WindowsClientPort(h, port));	
#endif
	return 0;
}
sPointer<Expression> StorageAllocator::newServerPort(int port)
{
#ifdef WINDOWS
	return createExp(new ServerPort(port));	
#endif
	return 0;
}


sPointer<Expression> StorageAllocator::newProcedure(sPointer<Expression> code)
{
	return createExp(new Procedure(code));
}

sPointer<Expression> StorageAllocator::newProcedureSubtype(Expression *f)
{
	Procedure* p = (Procedure*) f;
	return createExp(p);
}

using namespace builtins;
using namespace builtins::math;

/*
Bizarre compiler error with Visual C++: if you call WHELK_BIND more than 68 times
in this function, the compiler crashes.

*/
void StorageAllocator::initTopLevelEnvironment() {
	global = new Environment();
	initBuiltins();
	initBuiltins2();
	global = new Environment(global);
//	initLibraries();
	global = new Environment(global);
}

void StorageAllocator::loadLibrary(char *libname)
{
	fstream f(libname);
	if (!f.good()) {
		assert(false);
	}
	bool end_of_file;
	sPointer<Expression> file = Expression::parseFromStream(f, end_of_file);
	Machine m;
	m.setup(file);
	m.process();
	// we don't need the result
}

void StorageAllocator::initLibraries()
{
	loadLibrary("..\\lib\\base.wh");
//	loadLibrary("..\\lib\\io.wh");
}

void StorageAllocator::initBuiltins() {
	WHELK_BIND("+"				,Add			);
	WHELK_BIND("-"				,Subtract		);
	WHELK_BIND("*"				,Multiply		);
	WHELK_BIND("/"				,Divide			);
	WHELK_BIND("="				,E				);
	WHELK_BIND("<"				,LT				);
	WHELK_BIND("<="				,LTE			);
	WHELK_BIND(">"				,GT				);
	WHELK_BIND(">="				,GTE			);
	WHELK_BIND("car"				,Car			);
	WHELK_BIND("cdr"				,Cdr			);
	WHELK_BIND("cons"				,Cons			);
	WHELK_BIND("quote"			,Quote			);
	WHELK_BIND("if"				,If				);
	WHELK_BIND("define"			,Define			);
	WHELK_BIND("lambda"			,Lambda			);
	WHELK_BIND("eqv?"				,EqvQ			);
	WHELK_BIND("eq?"				,EqQ			);
	WHELK_BIND("react"			,React			);
	WHELK_BIND("rect"				,Rect			);
	WHELK_BIND("gquote"			,Gquote			);
	WHELK_BIND("import"			,Import			);
	WHELK_BIND("begin"			,Begin			);
	WHELK_BIND("string-length"	,String_Length	);
	WHELK_BIND("quotient"			,Quotient		);
	WHELK_BIND("remainder"		,Remainder		);
	WHELK_BIND("modulo"			,Modulo			);
	WHELK_BIND("floor"			,Floor			);
	WHELK_BIND("ceiling"			,Ceiling		);
	WHELK_BIND("truncate"			,Truncate		);
	WHELK_BIND("round"			,Round			);
	WHELK_BIND("sin"				,Sin			);
	WHELK_BIND("cos"				,Cos			);
	WHELK_BIND("tan"				,Tan			);
	WHELK_BIND("let"				,Let			);
	WHELK_BIND("and"				,And			);
	WHELK_BIND("or"				,Or				);
	WHELK_BIND("asin"				,Asin			);
	WHELK_BIND("acos"				,Acos			);
	WHELK_BIND("atan"				,Atan			);
	WHELK_BIND("sqrt"				,Sqrt			);
	WHELK_BIND("expt"				,Expt			);
	WHELK_BIND("log"				,Log			);
	WHELK_BIND("exp"				,Exp			);
	WHELK_BIND("string->number"	,String_Number	);
	WHELK_BIND("number->string"	,Number_String	);
	WHELK_BIND("symbol->string"	,Symbol_String	);
	WHELK_BIND("string->symbol"	,String_Symbol	);
	WHELK_BIND("number?"			,NumberQ		);
	WHELK_BIND("integer?"			,IntegerQ		);
	WHELK_BIND("pair?"			,PairQ			);
	WHELK_BIND("symbol?"			,SymbolQ		);
	WHELK_BIND("char?"			,CharQ			);
	WHELK_BIND("string?"			,StringQ		);
	WHELK_BIND("procedure?"		,ProcedureQ		);
	WHELK_BIND("set!"				,SetE			);
	WHELK_BIND("set-car!"			,Set_CarE		);
	WHELK_BIND("set-cdr!"			,Set_CdrE		);
	WHELK_BIND("char=?"			,CharE			);
	WHELK_BIND("char<?"			,CharLT			);
	WHELK_BIND("char>?"			,CharGT			);
	WHELK_BIND("char<=?"			,CharLTE		);
	WHELK_BIND("char>=?"			,CharGTE		);
	WHELK_BIND("char->integer"	,Char_Integer	);
	WHELK_BIND("integer->char"	,Integer_Char	);
	WHELK_BIND("make-string"		,Make_String	);
	WHELK_BIND("string-ref"		,String_Ref		);
	WHELK_BIND("string-set!"		,String_SetE		);
	WHELK_BIND("input-port?"		,Input_PortQ		);
	WHELK_BIND("output-port?"		,Output_PortQ		);
	WHELK_BIND("open-input-file"	,Open_Input_File	);
	WHELK_BIND("open-output-file"	,Open_Output_File	);
	WHELK_BIND("close-input-port"	,Close_Input_Port	);
	WHELK_BIND("close-output-port",Close_Output_Port	);
	WHELK_BIND("read-char"		,Read_Char			);
	WHELK_BIND("peek-char"		,Peek_Char			);
	WHELK_BIND("eof-object?"		,Eof_ObjectQ		);
//	WHELK_BIND("char-ready?"		,Char_ReadyQ		);
	WHELK_BIND("write-char"		,Write_Char			);
	WHELK_BIND("open-client-port"	,Open_Client_Port	);
	WHELK_BIND("open-server-port"	,Open_Server_Port	);
	WHELK_BIND("width?"			,WidthQ				);
	WHELK_BIND("height?"			,HeightQ			);
	WHELK_BIND("color-at?"		,Color_AtQ			);
}
void StorageAllocator::initBuiltins2()
{
	WHELK_BIND("apply"		,Apply		);
	WHELK_BIND("eval"			,Eval		);
	WHELK_BIND("cond"			,Cond		);
}


