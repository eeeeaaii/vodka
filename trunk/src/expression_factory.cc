#include "whelk.h"
#include "expression_factory.h"
#include "p_exp.h"
#include "expression.h"
#include "storage_manager.h"
#include "environment.h"
#include "for_debugging.h"
#include "char.h"


ExpressionFactory::ExpressionFactory()
{
}
ExpressionFactory::~ExpressionFactory()
{
}

sPtr ExpressionFactory::create(string mytext, Environment *newenv)
{
	dbg.trace("-------------------------------------\n");
	dbg.trace("factory: create\n");

	newenv->debugBindings();
	int newtype = determineType(mytext);
	assert(!Expression::isType(newtype, XT_UNKNOWN));
	if (Expression::isType(newtype, XT_SYMBOL)) {
		sPtr n;
		n = GSM.newSymbol(mytext);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_INTEGER)) {
		sPtr n;
		n = GSM.newInteger(mytext);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_REAL)) {
		sPtr n;
		n = GSM.newReal(mytext);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_STRING)) {
		sPtr n;
		n = GSM.newString(string(mytext), true);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_CHAR)) {
		sPtr n;
		n = GSM.newChar(mytext);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_BOOLEAN)) {
		sPtr n;
		n = GSM.newBoolean(mytext);
		n->setEnvironment(newenv);
		return n;
	} else if (Expression::isType(newtype, XT_NULL)) {
		sPtr n;
		n = GSM.newNull();
		n->setEnvironment(newenv);
		return n;
	}
	return 0;// should never happen...
}

int ExpressionFactory::determineType(sPtr p)
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

