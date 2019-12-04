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

#include "char.h"
#include "storage_allocator.h"
#include <string>
#include <sstream>

using namespace whelk;
using namespace std;

Char::Char()
{
	type = XT_CHAR;
	value = '?';
	setMytext(charToCCode(value));
}

Char::~Char()
{
}

Char::Char(char c)
{
	type = XT_CHAR;
	value = c;
	setMytext(charToCCode(value));
}

Char::Char(string ccode)
{
	type = XT_CHAR;
	value = ccodeToChar(ccode);
	setMytext(charToCCode(value));
}

char Char::ccodeToChar(string ccode) 
{
	initMap();
	multimap<string, char>::iterator i;
	i = cc2c.find(ccode);
	return i->second;
}

string Char::charToCCode(char in)
{
	initMap();
	multimap<char, string>::iterator i;
	i = c2cc.find(in);
	return i->second;
}

string Char::getCharRep()
{
	return charToCCode(value);
}

char Char::getCharCode()
{
	return value;
}

sPointer<Expression> Char::newobj()
{
	return GSA.createExp(new Char());
}

sPointer<Expression> Char::copystate(sPointer<Expression> n)
{
	((Char*)n)->value = value;
	return Expression::copystate(n);
}

/*
 * Static members
 */

bool Char::initialized = false;
multimap<char, string> Char::c2cc;
multimap<string, char> Char::cc2c;

void Char::initMap()
{
	if (initialized) return;
	initPair('\n', "#\\newline");
	initPair(' ', "#\\space");
	initPair(0x1b, "#\\escape");
	initPair(0x08, "#\\backspace");
	initPair(0x0a, "#\\linefeed");
	initPair(0x0d, "#\\return");
	initPair(0x7f, "#\\delete");
	initPair(0x09, "#\\tab");
	initPair(0x00, "#\\null");
	initPair(0x07, "#\\bell");
	initPair('a', "#\\a");
	initPair('b', "#\\b");
	initPair('c', "#\\c");
	initPair('d', "#\\d");
	initPair('e', "#\\e");
	initPair('f', "#\\f");
	initPair('g', "#\\g");
	initPair('h', "#\\h");
	initPair('i', "#\\i");
	initPair('j', "#\\j");
	initPair('k', "#\\k");
	initPair('l', "#\\l");
	initPair('m', "#\\m");
	initPair('n', "#\\n");
	initPair('o', "#\\o");
	initPair('p', "#\\p");
	initPair('q', "#\\q");
	initPair('r', "#\\r");
	initPair('s', "#\\s");
	initPair('t', "#\\t");
	initPair('u', "#\\u");
	initPair('v', "#\\v");
	initPair('w', "#\\w");
	initPair('x', "#\\x");
	initPair('y', "#\\y");
	initPair('z', "#\\z");
	initPair('A', "#\\A");
	initPair('B', "#\\B");
	initPair('C', "#\\C");
	initPair('D', "#\\D");
	initPair('E', "#\\E");
	initPair('F', "#\\F");
	initPair('G', "#\\G");
	initPair('H', "#\\H");
	initPair('I', "#\\I");
	initPair('J', "#\\J");
	initPair('K', "#\\K");
	initPair('L', "#\\L");
	initPair('M', "#\\M");
	initPair('N', "#\\N");
	initPair('O', "#\\O");
	initPair('P', "#\\P");
	initPair('Q', "#\\Q");
	initPair('R', "#\\R");
	initPair('S', "#\\S");
	initPair('T', "#\\T");
	initPair('U', "#\\U");
	initPair('V', "#\\V");
	initPair('W', "#\\W");
	initPair('X', "#\\X");
	initPair('Y', "#\\Y");
	initPair('Z', "#\\Z");
	initPair('1', "#\\1");
	initPair('2', "#\\2");
	initPair('3', "#\\3");
	initPair('4', "#\\4");
	initPair('5', "#\\5");
	initPair('6', "#\\6");
	initPair('7', "#\\7");
	initPair('8', "#\\8");
	initPair('9', "#\\9");
	initPair('0', "#\\0");
	initPair('!', "#\\!");
	initPair('@', "#\\@");
	initPair('#', "#\\#");
	initPair('$', "#\\$");
	initPair('%', "#\\%");
	initPair('^', "#\\^");
	initPair('&', "#\\&");
	initPair('*', "#\\*");
	initPair('(', "#\\(");
	initPair(')', "#\\)");
	initPair('-', "#\\-");
	initPair('=', "#\\=");
	initPair('_', "#\\_");
	initPair('+', "#\\+");
	initPair('[', "#\\[");
	initPair(']', "#\\]");
	initPair('\\', "#\\\\");
	initPair('{', "#\\{");
	initPair('}', "#\\}");
	initPair('|', "#\\|");
	initPair(';', "#\\;");
	initPair(':', "#\\:");
	initPair('\'', "#\\'");
	initPair('"', "#\\\"");
	initPair(',', "#\\,");
	initPair('<', "#\\<");
	initPair('.', "#\\.");
	initPair('>', "#\\>");
	initPair('/', "#\\/");
	initPair('?', "#\\?");
	for (int i = 0 ; i < 256 ; i++) {
		ostringstream x;
		x << "#\\";
		x.width(4);
		x.fill('0');
		x.setf(ios_base::right);
		x.unsetf(ios_base::showbase);
		x.setf(ios_base::hex);
		x << i;
		initPair(char(i), x.str());
	}
	initialized = true;
}

void Char::initPair(char c, string cc)
{
	c2cc.insert(c2ccpair(c, cc));
	cc2c.insert(cc2cpair(cc, c));
}
	
bool Char::isValidCharCode(string ccode)
{
	initMap();
	multimap<string, char>::iterator i;
	i = cc2c.find(ccode);
	return (i != cc2c.end());
}
