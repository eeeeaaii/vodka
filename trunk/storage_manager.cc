#include "carin.h"
#include "storage_manager.h"

#include "eval_exception.h"
#include "environment.h"
#include "expression.h"
#include "bitmap.h"
#include "integer.h"
#include "real.h"
#include "procedure.h"
#include "rcmstring.h"
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
Bizarre compiler error with Visual C++: if you call RCM_BIND more than 68 times
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
	loadLibrary("..\\lib\\base.rcm");
//	loadLibrary("..\\lib\\io.rcm");
}

void StorageManager::initBuiltins() {
	RCM_BIND("+"				,Add			);
	RCM_BIND("-"				,Subtract		);
	RCM_BIND("*"				,Multiply		);
	RCM_BIND("/"				,Divide			);
	RCM_BIND("="				,E				);
	RCM_BIND("<"				,LT				);
	RCM_BIND("<="				,LTE			);
	RCM_BIND(">"				,GT				);
	RCM_BIND(">="				,GTE			);
	RCM_BIND("car"				,Car			);
	RCM_BIND("cdr"				,Cdr			);
	RCM_BIND("cons"				,Cons			);
	RCM_BIND("quote"			,Quote			);
	RCM_BIND("if"				,If				);
	RCM_BIND("define"			,Define			);
	RCM_BIND("lambda"			,Lambda			);
	RCM_BIND("eqv?"				,EqvQ			);
	RCM_BIND("eq?"				,EqQ			);
	RCM_BIND("react"			,React			);
	RCM_BIND("rect"				,Rect			);
	RCM_BIND("gquote"			,Gquote			);
	RCM_BIND("import"			,Import			);
	RCM_BIND("begin"			,Begin			);
	RCM_BIND("string-length"	,String_Length	);
	RCM_BIND("quotient"			,Quotient		);
	RCM_BIND("remainder"		,Remainder		);
	RCM_BIND("modulo"			,Modulo			);
	RCM_BIND("floor"			,Floor			);
	RCM_BIND("ceiling"			,Ceiling		);
	RCM_BIND("truncate"			,Truncate		);
	RCM_BIND("round"			,Round			);
	RCM_BIND("sin"				,Sin			);
	RCM_BIND("cos"				,Cos			);
	RCM_BIND("tan"				,Tan			);
	RCM_BIND("let"				,Let			);
	RCM_BIND("and"				,And			);
	RCM_BIND("or"				,Or				);
	RCM_BIND("asin"				,Asin			);
	RCM_BIND("acos"				,Acos			);
	RCM_BIND("atan"				,Atan			);
	RCM_BIND("sqrt"				,Sqrt			);
	RCM_BIND("expt"				,Expt			);
	RCM_BIND("log"				,Log			);
	RCM_BIND("exp"				,Exp			);
	RCM_BIND("string->number"	,String_Number	);
	RCM_BIND("number->string"	,Number_String	);
	RCM_BIND("symbol->string"	,Symbol_String	);
	RCM_BIND("string->symbol"	,String_Symbol	);
	RCM_BIND("number?"			,NumberQ		);
	RCM_BIND("integer?"			,IntegerQ		);
	RCM_BIND("pair?"			,PairQ			);
	RCM_BIND("symbol?"			,SymbolQ		);
	RCM_BIND("char?"			,CharQ			);
	RCM_BIND("string?"			,StringQ		);
	RCM_BIND("procedure?"		,ProcedureQ		);
	RCM_BIND("set!"				,SetE			);
	RCM_BIND("set-car!"			,Set_CarE		);
	RCM_BIND("set-cdr!"			,Set_CdrE		);
	RCM_BIND("char=?"			,CharE			);
	RCM_BIND("char<?"			,CharLT			);
	RCM_BIND("char>?"			,CharGT			);
	RCM_BIND("char<=?"			,CharLTE		);
	RCM_BIND("char>=?"			,CharGTE		);
	RCM_BIND("char->integer"	,Char_Integer	);
	RCM_BIND("integer->char"	,Integer_Char	);
	RCM_BIND("make-string"		,Make_String	);
	RCM_BIND("string-ref"		,String_Ref		);
	RCM_BIND("string-set!"		,String_SetE		);
	RCM_BIND("input-port?"		,Input_PortQ		);
	RCM_BIND("output-port?"		,Output_PortQ		);
	RCM_BIND("open-input-file"	,Open_Input_File	);
	RCM_BIND("open-output-file"	,Open_Output_File	);
	RCM_BIND("close-input-port"	,Close_Input_Port	);
	RCM_BIND("close-output-port",Close_Output_Port	);
	RCM_BIND("read-char"		,Read_Char			);
	RCM_BIND("peek-char"		,Peek_Char			);
	RCM_BIND("eof-object?"		,Eof_ObjectQ		);
//	RCM_BIND("char-ready?"		,Char_ReadyQ		);
	RCM_BIND("write-char"		,Write_Char			);
	RCM_BIND("open-client-port"	,Open_Client_Port	);
	RCM_BIND("open-server-port"	,Open_Server_Port	);
	RCM_BIND("width?"			,WidthQ				);
	RCM_BIND("height?"			,HeightQ			);
	RCM_BIND("color-at?"		,Color_AtQ			);
}
void StorageManager::initBuiltins2()
{
	RCM_BIND("apply"		,Apply		);
	RCM_BIND("eval"			,Eval		);
	RCM_BIND("cond"			,Cond		);
}


