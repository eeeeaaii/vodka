#pragma once

#include "p_exp.h"

const int HEAPSIZE = 20000;



#define COPY_BYTYPE(CLASSNAME) \
		{\
			CLASSNAME *newp;\
			newp = new CLASSNAME();\
			sPtr r(newp);\
			allreferences[newp->getID()] = 0;\
			(*newp) = (*(CLASSNAME*)copyfrom);\
			return r;\
		}\

#define WHELK_BIND(x, y) global->addBinding((x), GSM.newProcedureSubtype(new (y)()));



namespace whelk {
	class Environment;
	class Thing;
	class Procedure;
	class Integer;
	class Real;
	class String;
	class Boolean;
	class Image;
	class Bitmap;
	class Pair;

	class StorageManager  
	{
	public:
		StorageManager();
		virtual ~StorageManager();
		
		Environment *global;
	//	Expression *allthings[HEAPSIZE]; // does not use sPtr
		int allreferences[HEAPSIZE];
		Environment *getGlobalEnvironment();

		template <class T> sPtr createExp(T *newp);



		sPtr newExpression();
		sPtr newExpression(string mytext);
		sPtr newExpression(Expression *copyfrom);
		sPtr newPair(sPtr car, sPtr cdr);
		sPtr newNull();
		sPtr newInteger(int num);
		sPtr newInteger(string numstr);
		sPtr newReal(double num);
		sPtr newReal(string numstr);
		sPtr newReal(int num);
		sPtr newImage(Bitmap *b);
		sPtr newString(string str, bool dec);
		sPtr newProcedure(sPtr code);
		sPtr newProcedureSubtype(Procedure *f);
		sPtr newBoolean(bool val);
		sPtr newBoolean(string val);
		sPtr newSymbol(string mytext);
		sPtr newChar(string x);
		sPtr newChar(char x);
		sPtr newFileInputPort(string s);
		sPtr newFileOutputPort(string s);
		sPtr newClientPort(string host, int port);
		sPtr newServerPort(int port);

		sPtr newByType(int type, void* copyfrom);

		void initTopLevelEnvironment();
		void initBuiltins();
		void initBuiltins2();
		void initLibraries();
		void loadLibrary(char *libname);

		void addRef(Expression *t); // does not use sPtr
		void removeRef(Expression *t); // does not use sPtr

	private:
		void releaseRef(Expression *t); // does not use sPtr

	};
};

extern StorageManager GSM;
