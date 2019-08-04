#include "whelk.h"
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


StorageManager GSM;

StorageManager::StorageManager()
{
	for (int i = 0 ; i < HEAPSIZE ; i++) {
		allreferences[i] = 0;
	}
}

StorageManager::~StorageManager()
{

}

Environment *StorageManager::getGlobalEnvironment()
{
	return global;
}

void StorageManager::addRef(Expression *t)
{
	allreferences[t->getID()]++;
}

void StorageManager::removeRef(Expression *t)
{
	allreferences[t->getID()]--;
	if (allreferences[t->getID()] == 0) {
		releaseRef(t);
	}
}

void StorageManager::releaseRef(Expression *t)
{
	delete t;
}

template <class T>
sPtr StorageManager::createExp(T *newp)
{
	sPtr r(newp);
	assert(newp->getID() < HEAPSIZE);
	allreferences[newp->getID()] = 0;
	dbg.trace("T %d has come into being\n");
	dbg.trace(newp->getID());
	dbg.trace("\n");
	return r;
}



sPtr StorageManager::newExpression()
{
	return createExp(new Expression());
}

sPtr StorageManager::newExpression(string mt)
{
	return createExp(new Expression(mt));
}

sPtr StorageManager::newSymbol(string mt)
{
	return createExp(new Symbol(mt));
}

sPtr StorageManager::newExpression(Expression *copyfrom)
{
	sPtr newp = createExp(new Expression());
	(*newp) = (*copyfrom);
	sPtr r(newp);
	return r;
}


sPtr StorageManager::newPair(sPtr ncar, sPtr ncdr)
{
	return createExp(new Pair(ncar, ncdr));
}

sPtr StorageManager::newImage(Bitmap *b)
{
	return createExp(new Image(b));
}
sPtr StorageManager::newBoolean(bool val)
{
	return createExp(new Boolean(val));
}

sPtr StorageManager::newBoolean(string val)
{
	return createExp(new Boolean(val));
}

sPtr StorageManager::newByType(int type, void *copyfrom)
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
}


sPtr StorageManager::newNull()
{
	return createExp(new Null());
}



sPtr StorageManager::newInteger(string numstr)
{
	return createExp(new Integer(numstr));
}

sPtr StorageManager::newInteger(int num)
{
	return createExp(new Integer(num));	
}



sPtr StorageManager::newReal(double num)
{
	return createExp(new Real(num));
}

sPtr StorageManager::newReal(int num)
{
	return createExp(new Real(num));
}


sPtr StorageManager::newReal(string numstr)
{
	return createExp(new Real(numstr));
}



sPtr StorageManager::newString(string str, bool dec)
{
	return createExp(new String(str, dec));	
}

sPtr StorageManager::newChar(string str)
{
	return createExp(new Char(str));	
}

sPtr StorageManager::newChar(char c)
{
	return createExp(new Char(c));	
}

sPtr StorageManager::newFileInputPort(string s)
{
	return createExp(new FileInputPort(s));	
}

sPtr StorageManager::newFileOutputPort(string s)
{
	return createExp(new FileOutputPort(s));	
}

sPtr StorageManager::newClientPort(string h, int port)
{
	return createExp(new ClientPort(h, port));	
}
sPtr StorageManager::newServerPort(int port)
{
	return createExp(new ServerPort(port));	
}


sPtr StorageManager::newProcedure(sPtr code)
{
	return createExp(new Procedure(code));
}

sPtr StorageManager::newProcedureSubtype(Procedure *f)
{
	return createExp(f);
}

using namespace builtins;
using namespace builtins::math;

/*
Bizarre compiler error with Visual C++: if you call WHELK_BIND more than 68 times
in this function, the compiler crashes.

*/
void StorageManager::initTopLevelEnvironment() {
	global = new Environment();
	initBuiltins();
	initBuiltins2();
	global = new Environment(global);
//	initLibraries();
	global = new Environment(global);
}

void StorageManager::loadLibrary(char *libname)
{
	fstream f(libname);
	if (!f.good()) {
		assert(false);
	}
	bool end_of_file;
	sPtr file = Expression::parseFromStream(f, end_of_file);
	Machine m;
	m.setup(file);
	m.process();
	// we don't need the result
}

void StorageManager::initLibraries()
{
	loadLibrary("..\\lib\\base.wh");
//	loadLibrary("..\\lib\\io.wh");
}

void StorageManager::initBuiltins() {
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
void StorageManager::initBuiltins2()
{
	WHELK_BIND("apply"		,Apply		);
	WHELK_BIND("eval"			,Eval		);
	WHELK_BIND("cond"			,Cond		);
}


