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

// Procedure.cpp: implementation of the Procedure class.
//
//////////////////////////////////////////////////////////////////////


#include "procedure.h"
#include "eval_exception.h"
#include "storage_allocator.h"
#include "environment.h"
#include "expression.h"
#include "event_handler.h"
#include "bitmap.h"
#include "whelk_string.h"
#include "integer.h"
#include "pair.h"
#include "real.h"
#include "boolean.h"
#include "number.h"
#include "for_debugging.h"
#include "char.h"
#include "port.h"
#include "net_port.h"
#include "bitmap.h"
#include "image.h"
#include "machine.h"
#include "expression_factory.h"

using namespace std;
using namespace whelk;

Procedure::Procedure()
{
	type = XT_PROCEDURE;
	mytext = "{procedure}";
}

Procedure::Procedure(sPointer<Expression> code)
{
	type = XT_PROCEDURE;
	mytext = "{procedure}";
	setCode(code);
}

Procedure::~Procedure()
{
}

sPointer<Expression> Procedure::getCodeRoot()
{
	return code;
}


sPointer<Expression> Procedure::evalPrimitive(vector<sPointer<Expression> > argv)
{
	argvector = argv;
	return apply();
}

void Procedure::addFormal(string f)
{
	varargs = false;
	formals.push_back(f);
}

void Procedure::addListFormal(string f)
{
	varargs = true;
	listformal = f;
}

vector<string> Procedure::getFormals()
{
	return formals;
}

void Procedure::addBindings(Environment *e, list<sPointer<Expression> > args)
{
	if (varargs) {
		sPointer<Expression> listarg = *(args.begin());
		e->addBinding(listformal, (Code*)listarg.getP());
	} else {
		list<sPointer<Expression> >::iterator lsPiter;
		vector<string>::iterator formiter;
		for (
				lsPiter = args.begin(),
				formiter = formals.begin();
				lsPiter != args.end() &&
				formiter != formals.end();
				lsPiter++,
				formiter++
			) {
			e->addBinding(*formiter, (Code*)(*lsPiter).getP());
		}
	}
}

void Procedure::getPrototype(vector<int>& prototype)
{
	vector<string>::iterator i;
	for (i = formals.begin() ; i != formals.end() ; i++) {
		prototype.push_back(XT_ANYTHING|XT_MULTIPLE);
	}
}

sPointer<Expression> Procedure::apply()
{
	assert(false);
	return 0;
}

void Procedure::setArgs(sPointer<Expression> a)
{
assert(false);
}

void Procedure::getSkipList(vector<bool>& skiplist)
{
	vector<int> prototype;
	vector<int>::iterator i;
	//retrieve vector of argument descriptors
	getPrototype(prototype);
	// loop through the argument descriptor
	for (i = prototype.begin() ; i != prototype.end() ; i++) {
		// for each argument descriptor, add a "true" value
		// to skiplist is we are going to skip it,
		// otherwise add "false"
		skiplist.push_back(*i & XT_SKIPEVAL);
	}
	// call by reference, so no need to return anything
}

void Procedure::setCode(sPointer<Expression> c)
{
	code = c;	
}

void Procedure::setArg(int i, sPointer<Expression> p)
{
	vector<sPointer<Expression> >::iterator it;
	int j;
	for (it = argvector.begin(), j = 0 ; it != argvector.end() ; it++, j++) {
		if (i == j) {
			*it = p;
			return;
		}
	}
}

int Procedure::numArgs()
{
	return argvector.size();
}

sPointer<Expression> Procedure::arg(int n)
{
	vector<sPointer<Expression> >::iterator argp;
	int c;
	for (argp = argvector.begin(), c = 0 ; argp != argvector.end() ; argp++, c++) {
		if (c == n) return *argp;
	}
	assert(false);
}


/*
 * note that checkNumArgs is a separate procedure from checkArgTypes
 * because 
 * 1. you check the number of args
 * 2. then you evaluate the arguments
 * 3. THEN you would check arg types
 *
 */
void Procedure::checkNumArgs()
{
	int n;
	int min = 0;
	int max = 0;
	bool variable = false;
	vector<int> prototype;
	getPrototype(prototype);
	n = numArgs();
	for (vector<int>::iterator i = prototype.begin() ; i != prototype.end() ; i++) {
		if (*i & XT_MULTIPLE) max = -1;
		if (!(*i & XT_OPTIONAL)) min++;
		if (max != -1) max++;
	}
	if (n < min || (max != -1 && n > max)) {
		throw new EvalException("wrong number of arguments.");
	}
}

void Procedure::checkArgTypes()
{
	vector<int> prototype;
	vector<int>::iterator iter;
	getPrototype(prototype);
	bool dontadvance = false;
	int k;
	for (	k = 0,
			iter = prototype.begin() 
		;
			k < numArgs()
			&& iter != prototype.end() 
		;
			iter++, (dontadvance?0:k++)
		)
	{
			dontadvance = false;
		//	dbg.trace("arg type: ");
		//	dbg.trace(arg(k)->getType());
		//	dbg.trace("\n");
			if (!arg(k)->isType(*iter)) {
				dbg.trace("oops, arg is wrong type");
				if (*iter & XT_OPTIONAL) {
					dbg.trace("ok, arg wrong type, but it's an optional arg");
					dontadvance = true;
				} else {
					dbg.trace("oops, arg wrong type, and not optional, throwing exception");
					throw new EvalException("argument is wrong type.");
				}
			} else {
				dbg.trace("arg is correct type, ok");
				if (*iter & XT_MULTIPLE) {
					dbg.trace("multiple args allowed, ok");
					while((k + 1) < numArgs() && arg(k + 1)->isType(*iter)) {
						dbg.trace("one of the multiple args accounted for, ok");
						k++;
					}
				} else {
					dbg.trace("ok, found correct arg, continuing.");
				}
			}
	}
}

sPointer<Expression> Procedure::promoteToLevel(sPointer<Expression> n, int level)
{
	// promote this item up the tower of types,
	// one type at a time, until it is up to 
	// *level*.
	while(n->getType() < level) {
		n = ((Number*)n)->promote();
	}
	return n;
}


// for n args, promote them all to the type
// of the arg with the highest type (in the type tower)
int Procedure::argPromote()
{
	int maxt = 0;
	int t;
	// loop thru all the args and find out the highest type in the type tower
	vector<sPointer<Expression> >::iterator p;
	for (p = argvector.begin() ; p != argvector.end() ; p++) {
		t = (*p)->getType();
		maxt = (t > maxt) ? t : maxt;
	}
	// loop thru again and promote everything to the highest type
	for (p = argvector.begin() ; p != argvector.end() ; p++) {
		*p = promoteToLevel(*p, maxt);
	}
	return maxt;
}

sPointer<Expression> Procedure::copystate(sPointer<Expression> n) {
	Procedure *pn = (Procedure*)n;
	vector<string>::iterator vi;
	for (vi = formals.begin() ; vi != formals.end() ; vi++) {
		pn->addFormal(*vi);
	}
	if (!!code) {
		pn->code = code->dupe();
	}
	pn->argvector.clear();
	vector<sPointer<Expression> >::iterator iter;
	for (iter = argvector.begin() ; iter != argvector.end() ; iter++) {
		pn->argvector.push_back((*iter)->dupe());
	}
	return Expression::copystate(n);
}



using namespace builtins;


//=============================================

void Car::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_PAIR);
}


sPointer<Expression> Car::apply()
{
	return ((Pair*)arg(0))->getCar();
}

//=============================================

void Cdr::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_PAIR);
}

sPointer<Expression> Cdr::apply()
{
	return ((Pair*)arg(0))->getCdr();
}

//=============================================

void Cons::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
	prototype.push_back(XT_PAIR|XT_NULL);
}

sPointer<Expression> Cons::apply()
{
	return GSA.newPair(arg(0), arg(1));
}

//=============================================

void Define::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING|XT_SKIPEVAL);
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> Define::apply()
{
	if (!env->changeBinding(arg(0)->getMytext(), (Code*)arg(1).getP())) {
		env->addBinding(arg(0)->getMytext(), (Code*)arg(1).getP());
	}
	// to do: this is wrong, should return the thing defined.
	sPointer<Expression> t = GSA.newExpression();
	t->setMytext("#n");
	return t;
}
//=============================================

void EqvQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> EqvQ::apply()
{
	sPointer<Expression> obj1, obj2;
	obj1 = arg(0);
	obj2 = arg(1);

	if (obj1->isType(XT_BOOLEAN) && obj2->isType(XT_BOOLEAN)) {
		return GSA.newBoolean(((Boolean*)obj1)->getBoolRep() == ((Boolean*)obj2)->getBoolRep());
	}
	if (obj1->isType(XT_SYMBOL) && obj2->isType(XT_SYMBOL)) {
		return GSA.newBoolean(obj1->getMytext() == obj2->getMytext());
	}
	if (obj1->isType(XT_INTEGER) && obj2->isType(XT_INTEGER)) {
		// need to do other types of numbers
		// and deal with exact/inexact
		return GSA.newBoolean(((Integer*)obj1)->getIntRep() == ((Integer*)obj2)->getIntRep());
	}
	if (obj1->isType(XT_CHAR) && obj2->isType(XT_CHAR)) {
		return GSA.newBoolean(obj1->getMytext() == obj2->getMytext());
	}
	if (obj1->isType(XT_NULL) && obj2->isType(XT_NULL)) {
		return GSA.newBoolean(true);
	}
	if (obj1->isType(XT_PAIR) && obj2->isType(XT_PAIR)) {
		return GSA.newBoolean(obj1.getP() == obj2.getP());
	}
	if (obj1->isType(XT_STRING) && obj2->isType(XT_STRING)) {
		// do pointer comparison
		// this is not even right because they are stored in an array in each object!
		assert(false);
		return false;
//		return GSA.newBoolean(((String*)obj1)->getStringRep() == ((String*)obj2)->getStringRep());
	}
	assert(!obj1->isType(XT_PROCEDURE));
//	if (obj1->isType(XT_PROCEDURE) && obj2->isType(XT_PROCEDURE)) {
//		return GSA.newBoolean(obj1.getProcedureRep() == obj2.getProcedureRep());
//	}
	return GSA.newBoolean(false);
}

//=============================================

void EqQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> EqQ::apply()
{
	return GSA.newBoolean(arg(0)->getID() == arg(1)->getID());
}



//=============================================

void If::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_BOOLEAN);
	prototype.push_back(XT_ANYTHING|XT_SKIPEVAL);
	prototype.push_back(XT_ANYTHING|XT_SKIPEVAL);
}

sPointer<Expression> If::apply()
{
	sPointer<Expression> firstalt, secondalt;
	// if has three arguments
	// 1. must evaluate to a boolean
	// 2. if 1. is true, eval this one and return it
	// 3. if 1. is false, eval this one and return it
	firstalt = arg(1);
	secondalt = arg(2);
	Machine m;
	assert(false); // WE HAVE TO KEEP ENV OF sPointer<Expression> IN STEP W/ ENV OF INSTRUCTION
	if (((Boolean*)arg(0))->getBoolRep()) {
		m.setup(firstalt, getEnvironment());
	} else {
		m.setup(secondalt, getEnvironment());
	}
	m.process();
	return m.result();
}

//=============================================

void Lambda::getPrototype(vector<int>& prototype)
{
//  keep the following commented code --
//  this is what it should actually be.
//	prototype.push_back(XT_PAIR|XT_SYMBOL);
	prototype.push_back(XT_ANYTHING|XT_SKIPEVAL);
	prototype.push_back(XT_ANYTHING|XT_MULTIPLE|XT_SKIPEVAL);
}

/* sPointer<Expression> apply()
 * There are two forms of this primitive
 * (lambda (arg1 arg2 arg3 ...) expr1 expr2 expr3 ...)
 * and
 * (lambda arglst expr1 expr2 expr3)
 * form 1 is the standard way
 * form 2 is used for to create functions with a variable number of arguments.
 *
 * This apply() function must return an object of type XT_PROCEDURE.
 * We save the names of the formal parameters for form 1 so that they
 * can be bound when the procedure is invoked.
 *
 * To make evaluation easier, we wrap the expressions (expr1, expr2, etc)
 * in a (begin ...). 
 */
sPointer<Expression> Lambda::apply()
{
	//......................................... set up the (begin ...)
	sPointer<Expression> code = GSA.newNull();
	for (int i = numArgs() - 1; i > 0 ; i--) {
		code = GSA.newPair(arg(i), code);
	}
	code = GSA.newPair(GSA.newExpression("begin"), code);

	//.......................................... determine which form
	int firstargtype;
	ExpressionFactory factory;
	firstargtype = factory.determineType(arg(0));

	// .......................................... do other stuff
	sPointer<Expression> p, newfunc;
	newfunc = GSA.newProcedure(code);
	if (firstargtype == XT_PAIR) {
		for (p = arg(0) ; !p->isType(XT_NULL) ; p = ((Pair*)p)->getCdr()) {
			sPointer<Expression> parameter = ((Pair*)p)->getCar();
			if (factory.determineType(parameter) != XT_SYMBOL) {
				EvalException *e = new EvalException("");
				e->addToMessage(parameter->getMytext());
				e->addToMessage(" is not a formal parameter.");
				throw e;
			}
			((Procedure*)newfunc)->addFormal(parameter->getMytext());
		}
	} else if (firstargtype == XT_SYMBOL) {
		((Procedure*)newfunc)->addListFormal(arg(0)->getMytext());
	} else {
		EvalException *e = new EvalException("invalid type.");
		throw e;
	}
	return newfunc;
}


//=============================================

void Quote::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING|XT_SKIPEVAL);
}

/*
void Quote::evalArgs()
{
	//assert(false);
	// don't eval anything
}
*/

sPointer<Expression> Quote::apply()
{
	// don't evalArgs!
	return arg(0);
}


//=============================================

void React::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING|XT_SKIPEVAL);
	prototype.push_back(XT_ANYTHING|XT_SKIPEVAL);
}

/*
 * (react ((mouseup (lambda (x y) (blah))) (mousedown (lambda (x y) (blah)))))
 *
 * This function needs a complete rewrite.
 */
sPointer<Expression> React::apply()
{
	assert(false);
	sPointer<Expression> dummy;
	return dummy;
	/*

	EventHandler *eh = 0;
	sPointer<Expression> r;
	sPointer<Expression> h;
	for ( int i = 1 ; i < numArgs() ; i++) {
		// each handler is a 2-element list
		if (((Pair*)arg(i))->countSiblings() != 2) {
			throw new EvalException("- this is wrong.");
		}
		if (!((Pair*)arg(i))->getCar()->isType(XT_STRING)) {
			throw new EvalException("- gotta say what kind of event.");
		}
		eh = new EventHandler();
		eh->setCode(((Pair*)((Pair*)arg(i))->getCdr())->getCar());
		if (!eh->setTypeFromString(((String*)((Pair*)arg(i))->getCar())->getStringRep().c_str())) {
			throw new EvalException("- that's not a type name.");
		}
	}
	Machine m;
	m.setup(arg(0), getEnvironment());
	m.process();
	r = m.result();
	
	if (eh) {
		r->addHandler(eh);
	}
	return r;
	*/
}

//=============================================

void Rect::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_INTEGER);
	prototype.push_back(XT_INTEGER);
	prototype.push_back(XT_PAIR|XT_SKIPEVAL);
}

sPointer<Expression> Rect::apply()
{
	// rect works like this
	// (rect 10 20 (0 255 128 0))
	// which creates a rect with w=10 and h=20
	// of color 00FF7F00
	// evaluate second and third arguments
	sPointer<Expression> rgbvalue = arg(2);
	if (rgbvalue->countSiblings() != 4) {
		throw new EvalException("- third arg to rect must be an RGBA color value.");
	}
	for (sPointer<Expression> p = rgbvalue ; !p->isType(XT_NULL) ; p = ((Pair*)p)->getCdr()) {
		Pair* pp;
		pp = (Pair*)p;
		Machine m;
		m.setup(pp->getCar(), getEnvironment());
		m.process();
		pp->setCar(m.result());
		if (!pp->getCar()->isType(XT_INTEGER)) {
			throw new EvalException("- incorrect RGB color value");
		}
	}

	int w = ((Integer*)arg(0))->getIntRep();
	int h = ((Integer*)arg(1))->getIntRep();
	int cr = ((Integer*)((Pair*)rgbvalue)->getCar())->getIntRep();
	int cg = ((Integer*)((Pair*)((Pair*)rgbvalue)->getCdr())->getCar())->getIntRep();
	int cb = ((Integer*)((Pair*)((Pair*)((Pair*)rgbvalue)->getCdr())->getCdr())->getCar())->getIntRep();
	int ca = ((Integer*)((Pair*)((Pair*)((Pair*)((Pair*)rgbvalue)->getCdr())->getCdr())->getCdr())->getCar())->getIntRep();

	Bitmap *b = new Bitmap();
	b->init(w, h);
	b->fill(Bitmap::c_RGBA(cr, cg, cb, ca));
	sPointer<Expression> r = GSA.newImage(b);
	return r;

}

//=============================================
void Gquote::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING|XT_SKIPEVAL);
}

sPointer<Expression> Gquote::apply()
{
	// don't evalArgs!
	sPointer<Expression> r;
	r = gquote_rec(arg(0));
	return r;
}

sPointer<Expression> Gquote::gquote_rec(sPointer<Expression> arg)
{
	sPointer<Expression> r;
	if (arg->isType(XT_PAIR)) {
		// if it's a list, we do one of two things.
		// 1. if it's a "react" statement we have to evaluate it first,
		//    then gquote the results.
		// 2. if it's not a react statement,
		//    we turn all the pairs into imagepairs, then
		//    gquote each item in the list.
		if (((Pair*)arg)->getCar()->getMytext() == "react") {
			Machine m;
			r = gquote_rec(m.eval(arg, arg->getEnvironment()));
		} else {
			sPointer<Expression> p;
			for (p = arg ; !p->isType(XT_NULL) ; p = ((Pair*)p)->getCdr()) {
				((Pair*)p)->setImagepair(true);
				((Pair*)p)->setCar(gquote_rec(((Pair*)p)->getCar()));
			}
			r = arg;
		}
	} else if (!arg->isType(XT_IMAGE)) {
		throw new EvalException("gquote: conversion to image type not yet supported");
	} else {
		r = arg;
	}
	return r;
}
//=============================================

void Import::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_STRING);
}

sPointer<Expression> Import::apply()
{
	// don't evalArgs!
	// first get the file
	sPointer<Expression> top;
	assert(false);
	const char* x = "Testit";
	fstream f(x);
	bool end_of_file = false;
	top = Expression::parseFromStream(f, end_of_file);
	// now evaluate
	Machine m;
	Pair *toppair;
	toppair = (Pair*)top;
	toppair->setCar(m.eval(toppair->getCar(), getEnvironment()));
	return top;
}

//=============================================

void Begin::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING|XT_MULTIPLE);
}

sPointer<Expression> Begin::apply()
{
	sPointer<Expression> last;
	assert(numArgs() > 0);
//	assert(!args->isType(XT_NULL));
	return arg(numArgs() - 1);
//	for (last = args ; !((Pair*)last)->getCdr()->isType(XT_NULL) ; last = ((Pair*)last)->getCdr()) ;
//	return last;
}

//=============================================

void String_Length::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_STRING);
}

sPointer<Expression> String_Length::apply()
{
	/*
	What do I have to do to make it so that I can write code like this?
	- String is an interface - abstract base class
	- Integer is an interface - abstract
	- sPointer<Expression> inherits from both String and Integer interfaces,
	  as well as Pair, etc, etc, implementing function calls
	  as calling the function on the underlying object.
	- String class also inherits from String interface, implementing
	  the function call in the real way.

	or to make it easier, have sPointer<Expression> just subclass all the other stuff.
	have to watch out for ambiguity.
	*/

	// find length of string
	/*
	String s;
	int len;
	s = (String)arg(0);
	len = s.getLength();
	Integer i = GSA.newInteger(len);
	return i;
	*/
	sPointer<Expression> s = arg(0);
	int len = ((String*)s)->getLength();
	sPointer<Expression> i = GSA.newInteger(len);
	return i;
}



//=============================================

void Let::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_PAIR|XT_SKIPEVAL);
	prototype.push_back(XT_ANYTHING|XT_MULTIPLE|XT_SKIPEVAL);
}


void Let::validateArguments()
{
	checkNumArgs();
	// evalArgs NOT called
	checkArgTypes();
	// make sure that we check the sublists within the first list
	// 
	// we know this is a pair because of checkArgTypes
	// but is it the case that each child is a pair?
	for (sPointer<Expression> deflist = arg(0) ; !deflist->isType(XT_NULL) ; deflist = ((Pair*)deflist)->getCdr()) {
		sPointer<Expression> definition = ((Pair*)deflist)->getCar();
		if (!definition->isType(XT_PAIR)) {
			throw new EvalException("arguments not right -- let");
		}
		sPointer<Expression> name = ((Pair*)definition)->getCar();
		ExpressionFactory ef;
		if (!(ef.determineType(name) == XT_SYMBOL)) {
			throw new EvalException("arguments not right -- let");
		}
		// and are there exactly two things in that list?
		sPointer<Pair> defcdr = (sPointer<Pair>)((Pair*)definition)->getCdr();
		if (!(
			defcdr->isType(XT_PAIR)
			&&
			defcdr->getCdr()->isType(XT_NULL)
			)) {
			throw new EvalException("arguments not right -- let");
		}
	}
}

sPointer<Expression> Let::apply()
{
	// bind variables in binding list
	pushEnvironment();
	for (sPointer<Expression> deflist = arg(0) ; !deflist->isType(XT_NULL) ; deflist = ((Pair*)deflist)->getCdr()) {
		sPointer<Pair> definition;
		sPointer<Expression> n, v;
		definition = (sPointer<Pair>)((Pair*)deflist)->getCar();
		n = definition->getCar();
		Machine m;
		Pair* defcdr;
		defcdr = ((Pair*)definition)->getCdr();
		v = m.eval(defcdr->getCar(), getEnvironment()->getParent());
		env->addBinding(n->getMytext(), (Code*)v.getP());
	}
	// next, evaluate everything in the list of expressions.
	sPointer<Expression> r;
	for (int k = 1 ; k < numArgs() ; k++) {
		Machine m;
		r = m.eval(arg(k), getEnvironment());
	}
	return r;
}

//=============================================

void And::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_BOOLEAN);
	prototype.push_back(XT_BOOLEAN);
}

sPointer<Expression> And::apply()
{
	sPointer<Expression> a = arg(0);
	sPointer<Expression> b = arg(1);
	bool a_ = ((Boolean*)a)->getBoolRep();
	bool b_ = ((Boolean*)b)->getBoolRep();
	return GSA.newBoolean(a_ && b_);
}

//=============================================

void Or::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_BOOLEAN);
	prototype.push_back(XT_BOOLEAN);
}

sPointer<Expression> Or::apply()
{
	sPointer<Expression> a = arg(0);
	sPointer<Expression> b = arg(1);
	bool a_ = ((Boolean*)a)->getBoolRep();
	bool b_ = ((Boolean*)b)->getBoolRep();
	return GSA.newBoolean(a_ || b_);
}


//=============================================

void NumberQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> NumberQ::apply()
{
	sPointer<Expression> n = arg(0);
	bool b = n->isType(XT_NUMBER);
	return GSA.newBoolean(b);
}

//=============================================

void IntegerQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> IntegerQ::apply()
{
	sPointer<Expression> n = arg(0);
	bool b = n->isType(XT_INTEGER);
	return GSA.newBoolean(b);
}
//=============================================

void PairQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> PairQ::apply()
{
	sPointer<Expression> n = arg(0);
	bool b = n->isType(XT_PAIR);
	return GSA.newBoolean(b);
}
//=============================================

void SymbolQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> SymbolQ::apply()
{
	sPointer<Expression> n = arg(0);
	bool b = n->isType(XT_SYMBOL);
	return GSA.newBoolean(b);
}
//=============================================

void CharQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> CharQ::apply()
{
	sPointer<Expression> n = arg(0);
	bool b = n->isType(XT_CHAR);
	return GSA.newBoolean(b);
}
//=============================================

void StringQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> StringQ::apply()
{
	sPointer<Expression> n = arg(0);
	bool b = n->isType(XT_STRING);
	return GSA.newBoolean(b);
}
//=============================================

void ProcedureQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> ProcedureQ::apply()
{
	sPointer<Expression> n = arg(0);
	bool b = n->isType(XT_PROCEDURE);
	return GSA.newBoolean(b);
}

//=============================================


void SetE::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING|XT_SKIPEVAL); // should be XT_SYMBOL
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> SetE::apply()
{
	// (set a ...something...) is supposed to return the OLD value of a.
	Environment *e = getEnvironment();
	string symbol = arg(0)->getMytext();
	sPointer<Expression> old = (Expression*)e->lookupBinding(symbol).getP();
	if (!old) {
		throw new EvalException("set! -- this variable was never defined.");
	} else {
		e->changeBinding(symbol, (Code*)arg(1).getP());
	}
	return old;
}

//=============================================


void Set_CarE::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_PAIR);
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> Set_CarE::apply()
{
	// return value is unspecified -- I will follow same rule as we do for set!
	sPointer<Expression> old = ((Pair*)arg(0))->getCar();
	((Pair*)arg(0))->setCar(arg(1));
	return old;
}
//=============================================


void Set_CdrE::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_PAIR);
	prototype.push_back(XT_PAIR|XT_NULL);
}

sPointer<Expression> Set_CdrE::apply()
{
	// return value is unspecified -- I will follow same rule as we do for set!
	sPointer<Expression> old = ((Pair*)arg(0))->getCdr();
	((Pair*)arg(0))->setCdr(arg(1));
	return old;
}

//=============================================

void String_Number::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_STRING);
}

sPointer<Expression> String_Number::apply()
{
	string s = ((String*)arg(0))->getStringRep();
	istringstream is(s);
	double d;
	int i;
	if (is >> d) {
		return GSA.newReal(d);
	} else if (is >> i) {
		return GSA.newInteger(i);
	} else {
		return GSA.newNull();
	}
}

//=============================================

void Number_String::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPointer<Expression> Number_String::apply()
{
	int type = arg(0)->getType();
	ostringstream s;
	switch(type) {
	case XT_INTEGER:
		{
			s << ((Integer*)arg(0))->getIntRep();
			return GSA.newString(s.str(), false);
		}
	case XT_REAL:
		{
			s << ((Real*)arg(0))->getRealRep();
			return GSA.newString(s.str(), false);
		}
	}
	return 0;
}

//=============================================

void String_Symbol::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_STRING);
}

sPointer<Expression> String_Symbol::apply()
{
	string str = ((String*)arg(0))->getStringRep();
	return GSA.newSymbol(str.c_str());
}

//=============================================

void Symbol_String::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_SYMBOL);
}

sPointer<Expression> Symbol_String::apply()
{
	string str = arg(0)->getMytext();
	return GSA.newString(str, true);
}
//=============================================

void CharE::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_CHAR);
	prototype.push_back(XT_CHAR);
}

sPointer<Expression> CharE::apply()
{
	char c0 = ((Char*)arg(0))->getCharCode();
	char c1 = ((Char*)arg(1))->getCharCode();
	return GSA.newBoolean(c0 == c1);
}

//=============================================

void CharLT::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_CHAR);
	prototype.push_back(XT_CHAR);
}

sPointer<Expression> CharLT::apply()
{
	char c0 = ((Char*)arg(0))->getCharCode();
	char c1 = ((Char*)arg(1))->getCharCode();
	return GSA.newBoolean(c0 < c1);
}

//=============================================

void CharGT::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_CHAR);
	prototype.push_back(XT_CHAR);
}

sPointer<Expression> CharGT::apply()
{
	char c0 = ((Char*)arg(0))->getCharCode();
	char c1 = ((Char*)arg(1))->getCharCode();
	return GSA.newBoolean(c0 > c1);
}

//=============================================

void CharLTE::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_CHAR);
	prototype.push_back(XT_CHAR);
}

sPointer<Expression> CharLTE::apply()
{
	char c0 = ((Char*)arg(0))->getCharCode();
	char c1 = ((Char*)arg(1))->getCharCode();
	return GSA.newBoolean(c0 <= c1);
}

//=============================================

void CharGTE::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_CHAR);
	prototype.push_back(XT_CHAR);
}

sPointer<Expression> CharGTE::apply()
{
	char c0 = ((Char*)arg(0))->getCharCode();
	char c1 = ((Char*)arg(1))->getCharCode();
	return GSA.newBoolean(c0 >= c1);
}

//=============================================

void Char_Integer::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_CHAR);
}

sPointer<Expression> Char_Integer::apply()
{
	return GSA.newInteger(((Char*)arg(0))->getCharCode());
}
//=============================================

void Integer_Char::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_INTEGER);
}

sPointer<Expression> Integer_Char::apply()
{
	return GSA.newChar(char(((Integer*)arg(0))->getIntRep()));
}

//=============================================

void Make_String::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_INTEGER);
	prototype.push_back(XT_CHAR);
}

sPointer<Expression> Make_String::apply()
{
	char x = ((Char*)arg(1))->getCharCode();
	int n = ((Integer*)arg(0))->getIntRep();
	ostringstream os;
	for (int i = 0 ; i < n ; i++) {
		os << x;
	}
	return GSA.newString(os.str(), false);
}
//=============================================

void String_Ref::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_STRING);
	prototype.push_back(XT_INTEGER);
}

sPointer<Expression> String_Ref::apply()
{
	int i = ((Integer*)arg(1))->getIntRep();
	string s = ((String*)arg(0))->getStringRep();
	if (i >= (int)s.size() || i < 0) {
		throw new EvalException("string-ref: arg out of range.");
	}
	dbg.trace(s.c_str());
	dbg.trace("\n");
	dbg.trace((string("test") + s).c_str());
	char c = s[i];
	return GSA.newChar(c);
}


//=============================================

void String_SetE::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_STRING);
	prototype.push_back(XT_INTEGER);
	prototype.push_back(XT_CHAR);
}

sPointer<Expression> String_SetE::apply()
{
	string s = ((String*)arg(0))->getStringRep();
	int i = ((Integer*)arg(1))->getIntRep();
	char c = ((Char*)arg(2))->getCharCode();
	if (i >= (int)s.size() || i < 0) {
		throw new EvalException("string-ref: arg out of range.");
	}
	char oldc;
	oldc = s[i];
	s[i] = c;
	((String*)arg(0))->setStringRep(s, false);
	return GSA.newChar(c);
}




//=============================================

void Apply::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_PROCEDURE);
	prototype.push_back(XT_ANYTHING|XT_MULTIPLE|XT_OPTIONAL);
	prototype.push_back(XT_PAIR);
}

sPointer<Expression> Apply::apply()
{
	// apply the procedure in arg(0)
	// to the set of arguments given by
	// appending all args to the final pair
	assert(false);	
	sPointer<Expression> p;
	return p;
//	int n = args->countSiblings();
//	sPointer<Expression> a = arg(n - 1);
//	for (int i = n - 2 ; i > 0 ; i--) {
//		a = GSA.newPair(arg(i), a);
//	}
//	return ((Procedure*)arg(0))->execute(a, getEnvironment());
}




//=============================================

void Eval::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
}

sPointer<Expression> Eval::apply()
{
	Machine m;
	return m.eval(arg(0), getEnvironment());
}



//=============================================


void Cond::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING|XT_SKIPEVAL);
	prototype.push_back(XT_PAIR|XT_MULTIPLE|XT_SKIPEVAL);
}

sPointer<Expression> Cond::apply()
{
	sPointer<Expression> r;
	// loop through all conditional clauses
	for (int i = 0 ; i < numArgs() ; i++) {
		sPointer<Expression> testclause = ((Pair*)arg(i))->getCar();
		// if it just says "else"
		if (testclause->getMytext() == "else") {
			// else must be the LAST expression in the cond
			if (i != numArgs() - 1) {
				throw new EvalException("misplaced \"else\".");
			} else {
				// evaluate arguments in order, returning last one
				// if there's an else then there MUST be at least
				// one thing in the list.
				bool gotone = false;
				for (
						sPointer<Expression> p = ((Pair*)arg(i))->getCdr() ;
						!p->isType(XT_NULL);
						p = ((Pair*)p)->getCdr()
					 ) {
					gotone = true;
					Machine m;
					r = m.eval(((Pair*)p)->getCar(), getEnvironment());
				}
				if (!gotone) {
					throw new EvalException("bad 'else' clause.");
				}
				// note that we break so as to ignore any clauses after
				// the first one that evaluates to true.
				break;
			}
		} else {
			// evaluate first thing in the list
			// #t or #f is what is returned if there are no other expressions
			Machine m;
			r = m.eval(testclause, getEnvironment());
			if (!r->isType(XT_BOOLEAN)) {
				throw new EvalException("need boolean expression in cond");
			}
			bool b = ((Boolean*)r)->getBoolRep();
			if (b) {
				for (
						sPointer<Expression> p = ((Pair*)arg(i))->getCdr() ;
						!p->isType(XT_NULL);
						p = ((Pair*)p)->getCdr()
					 ) {
					// return the last expression
					Machine m;
					r = m.eval(((Pair*)p)->getCar(), getEnvironment());
				}
				// note that we break so as to ignore any clauses after
				// the first one that evaluates to true.
				break;
			}
		}
		
	}
	return r;
}

//=============================================

void Input_PortQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
}


sPointer<Expression> Input_PortQ::apply()
{
	bool b = arg(0)->isType(XT_INPUT_PORT);
	return GSA.newBoolean(b);
}


//=============================================

void Output_PortQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_ANYTHING);
}


sPointer<Expression> Output_PortQ::apply()
{
	bool b = arg(0)->isType(XT_OUTPUT_PORT);
	return GSA.newBoolean(b);
}



//=============================================

void Open_Input_File::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_STRING);
}


sPointer<Expression> Open_Input_File::apply()
{

	string s = ((String*)arg(0))->getStringRep();
	sPointer<Expression> p = GSA.newFileInputPort(s);
	return p;
}



//=============================================

void Open_Output_File::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_STRING);
}


sPointer<Expression> Open_Output_File::apply()
{
	string s = ((String*)arg(0))->getStringRep();
	sPointer<Expression> p = GSA.newFileOutputPort(s);
	return p;
}



//=============================================

void Close_Input_Port::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_INPUT_PORT);
}


sPointer<Expression> Close_Input_Port::apply()
{
	// broken!
	((Port*)arg(0))->close();
	return 0;
}



//=============================================

void Close_Output_Port::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_OUTPUT_PORT);
}


sPointer<Expression> Close_Output_Port::apply()
{
	// broken!
	((Port*)arg(0))->close();
	return 0;
}


//=============================================

void Read_Char::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_INPUT_PORT|XT_CLIENT_PORT|XT_SERVER_PORT);
}


sPointer<Expression> Read_Char::apply()
{
	int t = arg(0)->getType();
	char c;
	switch(t) {
	case XT_INPUT_PORT:
		c = ((InputPort*)arg(0))->readChar();
		break;
	case XT_CLIENT_PORT:
		c = ((ClientPort*)arg(0))->readChar();
		break;
	case XT_SERVER_PORT:
		assert(false);
		break;
	}
	return GSA.newChar(c);
}

//=============================================

void Peek_Char::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_INPUT_PORT);
}


sPointer<Expression> Peek_Char::apply()
{
	char c = ((InputPort*)arg(0))->peekChar();
	return GSA.newChar(c);
}




//=============================================

void Write_Char::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_CHAR);
	prototype.push_back(XT_OUTPUT_PORT|XT_CLIENT_PORT|XT_SERVER_PORT);
}


sPointer<Expression> Write_Char::apply()
{
	char c = ((Char*)arg(0))->getCharCode();
	int t = arg(1)->getType();
	switch(t) {
	case XT_OUTPUT_PORT:
		((OutputPort*)arg(1))->writeChar(c);
		break;
	case XT_CLIENT_PORT:
		((ClientPort*)arg(1))->writeChar(c);
		break;
	case XT_SERVER_PORT:
		assert(false);
		break;
	}
	return arg(0);
}






//=============================================

void Eof_ObjectQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_INPUT_PORT);
}


sPointer<Expression> Eof_ObjectQ::apply()
{
	bool b = ((InputPort*)arg(0))->isEof();
	return GSA.newBoolean(b);
}

//=============================================

void Open_Client_Port::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_STRING);
	prototype.push_back(XT_INTEGER);
}


sPointer<Expression> Open_Client_Port::apply()
{
	string s = ((String*)arg(0))->getStringRep();
	int i = ((Integer*)arg(1))->getIntRep();
	sPointer<Expression> p = GSA.newClientPort(s, i);
	return p;
}



//=============================================

void Open_Server_Port::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_INTEGER);
}


sPointer<Expression> Open_Server_Port::apply()
{
	int i = ((Integer*)arg(0))->getIntRep();
	sPointer<Expression> p = GSA.newServerPort(i);
	return p;
}


//=============================================

void WidthQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_IMAGE);
}

sPointer<Expression> WidthQ::apply()
{
	Image* i = ((Image*)arg(0));
	int w = i->getWidth();
	return GSA.newInteger(w);
}

//=============================================

void HeightQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_IMAGE);
}

sPointer<Expression> HeightQ::apply()
{
	Image* i = ((Image*)arg(0));
	int h = i->getHeight();
	return GSA.newInteger(h);
}

//=============================================

void Color_AtQ::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_IMAGE);
	prototype.push_back(XT_INTEGER);
	prototype.push_back(XT_INTEGER);
}


sPointer<Expression> Color_AtQ::apply()
{
	Image *i = ((Image*)arg(0));
	int x = ((Integer*)arg(1))->getIntRep();
	int y = ((Integer*)arg(2))->getIntRep();
	if (x < 0 || y < 0 || x >= i->getWidth() || x >= i->getHeight()) {
		// not sure whether to throw exception or return null
		assert(false);
	}
	int color = i->getColorAt(x, y);
	int r = Bitmap::getc_R(color);
	int g = Bitmap::getc_G(color);
	int b = Bitmap::getc_B(color);
	int a = Bitmap::getc_A(color);
	return GSA.newPair(
				GSA.newInteger(r),
				GSA.newPair(
					GSA.newInteger(g),
					GSA.newPair(
						GSA.newInteger(b),
						GSA.newPair(
							GSA.newInteger(a),
							GSA.newNull()
						)
					)
				)
			);
}

