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


#include "expression_factory.h"
#include "p_exp.h"
#include "expression.h"
#include "storage_allocator.h"
#include "environment.h"
#include "for_debugging.h"
#include "char.h"
#include <string>
#include <sstream>

using namespace whelk;
using namespace std;

ExpressionFactory::ExpressionFactory()
{
}
ExpressionFactory::~ExpressionFactory()
{
}

sPointer<Expression> ExpressionFactory::create(string mytext, Environment *newenv)
{
	dbg.trace("-------------------------------------\n");
	dbg.trace("factory: create\n");

	newenv->debugBindings();
	int newtype = determineType(mytext);
	assert(!Expression::isType(newtype, XT_UNKNOWN));
	if (Expression::isType(newtype, XT_SYMBOL)) {
		sPointer<Expression> n;
		n = GSA.newSymbol(mytext);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_INTEGER)) {
		sPointer<Expression> n;
		n = GSA.newInteger(mytext);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_REAL)) {
		sPointer<Expression> n;
		n = GSA.newReal(mytext);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_STRING)) {
		sPointer<Expression> n;
		n = GSA.newString(string(mytext), true);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_CHAR)) {
		sPointer<Expression> n;
		n = GSA.newChar(mytext);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_BOOLEAN)) {
		sPointer<Expression> n;
		n = GSA.newBoolean(mytext);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_NULL)) {
		sPointer<Expression> n;
		n = GSA.newNull();
		n->setEnvironment(newenv);
		return n;
	}
	return 0;// should never happen...
}

int ExpressionFactory::determineType(sPointer<Expression> p)
{
	return determineType(p->getMytext());
}

int ExpressionFactory::determineType(string mytext)
{
	int sz = mytext.size();
	char f = 0, f2 = 0;
	if (sz > 0) f = mytext[0];
	if (sz > 1) f2 = mytext[1];
	// check for XT_NULL
	if (mytext == "") return XT_NULL;
	// check for XT_INTEGER
	{
		istringstream is(mytext);
		is.unsetf(ios_base::skipws);
		int i;
		if (is >> i) {
			if (is.peek() == char_traits<char>::eof()) {
				return XT_INTEGER;
			}
		}
	}
	// check for XT_REAL
	{
		istringstream is(mytext);
		is.unsetf(ios_base::skipws);
		double d;
		if (is >> d) {
			if (is.peek() == char_traits<char>::eof()) {
				return XT_REAL;
			}
		}
	}
	// check for XT_STRING
	if (f == '"') {
		if (mytext.size() < 2) return XT_UNKNOWN;
		if (mytext[mytext.size() - 1] != '"') return XT_UNKNOWN;
		return XT_STRING;
	}
	// check for XT_BOOLEAN
	if (f == '#' && (f2 == 't' || f2 == 'T' || f2 == 'f' || f2 == 'F') && sz == 2) {
		return XT_BOOLEAN;
	}
	// check for XT_CHAR
	if (f == '#' && f2 == '\\' && Char::isValidCharCode(mytext)) {
		return XT_CHAR;
	}
	// check for XT_NULL
	if (f == '?' && sz == 1) {
		return XT_NULL;
	}
	// check for XT_SYMBOL
	if (isLegalSymbol(mytext)) {
		return XT_SYMBOL;
	}
	// default to XT_UNKNOWN
	return XT_UNKNOWN;

}



bool ExpressionFactory::isLegalSymbolChar(char c) {
	return (
		isLegalSymbolFirstChar(c)
	||	(c >= '0' && c <= '9')
	||  (c == '+')
	||  (c == '-')
	||  (c == '.')
	||  (c == '@')
	);
}

bool ExpressionFactory::isLegalSymbolFirstChar(char c) {
	return (
		(c >= 'a' && c <= 'z')
	||	(c >= 'A' && c <= 'Z')
	||	(c == '!')
	||	(c == '$')
	||	(c == '%')
	||	(c == '&')
	||	(c == '*')
	||	(c == '/')
	||	(c == ':')
	||	(c == '<')
	||	(c == '=')
	||	(c == '>')
	||	(c == '?')
	||	(c == '^')
	||	(c == '_')
	||	(c == '~')
	);
}

bool ExpressionFactory::isLegalSymbol(string mytext)
{
	bool first = true;
	bool testpassed = true;

	// special symbol
	if (mytext == "+") return true;
	if (mytext == "-") return true;
	if (mytext == "...") return true;

	for (unsigned int i = 0 ; i < mytext.size() ; i++) {
		if (first) {
			if (!isLegalSymbolFirstChar(mytext[i])) {
				testpassed = false;
				break;
			}
			first = false;
		} else {
			if (!isLegalSymbolChar(mytext[i])) {
				testpassed = false;
				break;
			}
		}
	}
	return testpassed;
}

