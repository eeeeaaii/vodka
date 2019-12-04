// Copyright 2003-2005, 2008, 2019 Jason Scherer
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

#include "expression.h"
#include "eval_exception.h"
#include "storage_allocator.h"
#include "procedure.h"
#include "environment.h"
#include "graphics_context.h"
#include "event.h"
#include "event_handler.h"
#include "ide_event_handler.h"
#include "bitmap.h"
#include "image.h"
#include "pair.h"
#include "environment.h"
#include "for_debugging.h"
#include <string>

using namespace whelk;
using namespace std;

Expression::Expression(string mt) : Code()
{
	mytext = mt;
	initialize();
}

Expression::Expression() : Code()
{
	mytext = "";
	initialize();
}

void Expression::initialize()
{
	type = XT_UNKNOWN;
	isTop = false;
	cached_width = 0;
	cached_height = 0;
	selected = 0;
	dirtyness = (HDIR | VDIR | ZDIR);
	env = 0;
	setEnvironment(GSA.getGlobalEnvironment());
}


bool Expression::getSelected()
{
	return selected;
}

void Expression::setSelected(bool ns)
{
	selected = ns;
}

int Expression::getDirtyness()
{
	return dirtyness;
}

void Expression::setDirtyness(int b)
{
	if (dirtyness != b) {
		dbg.trace("%d: dirtyness was %d, now %d\n");
	} else {
		dbg.trace("%d: dirtyness remains %d\n");
	}
	dirtyness = b;
}

bool Expression::getIsTop()
{
	return isTop;
}

void Expression::setIsTop(bool nt)
{
	isTop = nt;
}

string Expression::getMytext() {
	return mytext;
}

string Expression::getDisplayMytext()
{
	if (mytext == "") {
		return string("?");
	} else {
		return mytext;
	}
}

void Expression::setMytext(string n)
{
	mytext = n;
}



Expression::~Expression()
{
}


void Expression::setEnvironment(Environment *newenv)
{
	newenv->addRef();
	if (env) {
		env->removeRef();
	}
	env = newenv;
} 
 
void Expression::pushEnvironment()
{ 
	Environment *newenv;
	newenv = new Environment();
	newenv->setParent(env);
	env->addRef();
	env = newenv;
} 
 
Environment *Expression::getEnvironment()
{
	return env;
}

void Expression::dumpTree(int level)
{
	int i;
	char bf[64];
	if (level == 0) {
		dbg.trace("--------------------\n");
	}
	for (i = level ; i > 0 ; i--) {
		dbg.trace("| ");
	}
	if (selected) {
		dbg.trace("%3d#%s\n");
	} else {
		dbg.trace("%3d.%s\n");
	}
	if (type == XT_PAIR) {
		Pair *p;
		p = (Pair*)this;
		if (!!p->getCar()) p->getCar()->dumpTree(level + 1);
		if (!!p->getCdr()) p->getCdr()->dumpTree(level + 1);
	}
	if (level == 0) {
		dbg.trace("--------------------\n");
	}
}

sPointer<Expression> Expression::copystate(sPointer<Expression> n)
{
	n->setType(getType());
	n->setMytext(getMytext());
	return n;
	// don't think these are important.
//	n->setDirtyness(getDirtyness());
//	n->setCachedWidth(getCachedWidth());
//	n->setCachedHeight(getCachedHeight());
}

sPointer<Expression> Expression::dupe()
// overridden in class Pair
// overridden in class Image
{
	// this function clones this Expression
	// newobj is a form of "Virtual Constructor"
	// see Stroustrop, "The C++ Programming Language", pg. 424
	sPointer<Expression> newme = newobj();
	return copystate(newme);
}

sPointer<Expression> Expression::newobj() 
{
   	return GSA.createExp(new Expression()); 
}

Delta Expression::draw(GraphicsContext *grcon)
// overridden in class Pair
// overridden in class Image
// overridden in class Null
{
	dbg.trace("%d: drawing expression\n");
	Point p;
	int dx = 0, dy = 0;

	p = grcon->popOrigin();
	grcon->drawText(getDisplayMytext(), p.x, p.y, selected);
	dx += getWidth(grcon);
	dy += getHeight(grcon);
	Delta d(dx, dy);
	return d;

}
// overridden in class Pair
// overridden in class Image
int Expression::getHeight(GraphicsContext *grcon)
{
	if (getDirtyness() & VDIR) {
		dbg.trace("%d: recalculating height\n");
		cached_height = grcon->getTextHeight(getDisplayMytext());
		setDirtyness(getDirtyness() & ~VDIR);
	} else {
		dbg.trace("%d: using cached height\n");
	}
	return cached_height;
}
// overridden in class Pair
// overridden in class Image
int Expression::getWidth(GraphicsContext *grcon)
{
	if (getDirtyness() & HDIR) {
		dbg.trace("%d: recalculating width\n");
		cached_width = grcon->getTextWidth(getDisplayMytext());
		setDirtyness(getDirtyness() & ~HDIR);
	} else {
		dbg.trace("%d: using cached width\n");
	}
	return cached_width;
}


int Expression::countSiblings()
{
	assert(isType(XT_PAIR) || isType(XT_NULL));
	int i = 0;
	sPointer<Expression> p(this);
	while (!p->isType(XT_NULL)) {
		assert(p->isType(XT_PAIR));
		i++;
		p = ((Pair*)p)->getCdr();
	}
	return i; // for now, we assume it's a proper list
}

sPointer<Expression> Expression::lastSibling()
{
	assert(isType(XT_PAIR));
	sPointer<Expression> p(this);
	if (((Pair*)p)->getCdr()->isType(XT_NULL)) {
		return p;
	} else {
		return ((Pair*)p)->getCdr()->lastSibling();
	}
}

bool Expression::isType(int t)
{
	return isType(getType(), t);
}

bool Expression::isType(int testtype, int desiredtype)
{
	return (testtype & desiredtype);
}

void Expression::setType(int t)
{
	type = t;
}

int Expression::getType()
{
	return type;
}

void Expression::resetType()
{
	type = XT_UNKNOWN;
}

// overridden in Pair
string Expression::toString(bool isFirst)
{
	if (mytext == "") {
		return string("{unknown}");
	} else {
		return string(mytext);
	}
}

sPointer<Expression> Expression::getList(istream& s, Direction dir, bool& end_of_file)
{
	char c;
	sPointer<Expression> r;
	dbg.trace("getting list\n");
	while((s >> c) && c == ' ');
	if (!isRightParen(c)) {
		s.putback(c);
		sPointer<Expression> p1 = parseFromStream(s, end_of_file);
		sPointer<Expression> p2 = getList(s, dir, end_of_file);
		r = GSA.newPair(p1, p2);
		((Pair*)r)->setDirection(dir);
	} else {
		r = GSA.newNull();
	}
	return r;
}

bool Expression::isWhitespace(char c)
{
	return (c == ' ' || c == '\t' || c == '\n');
}

bool Expression::isLeftParen(char c)
{
	return (c == '(' || c == '{' || c == '[');
}

bool Expression::isRightParen(char c)
{
	return (c == ')' || c == '}' || c == ']');
}

sPointer<Expression> Expression::parseFromStream(istream& s, bool& end_of_file)
{
	char c;
	sPointer<Expression> r;

	dbg.trace("getting string\n");
	s.unsetf(ios_base::skipws);
	// skip whitespace
	while((s >> c) && isWhitespace(c));
	if (c == 0) end_of_file = true;
	if (isLeftParen(c)) {
		Direction d;
		switch(c) {
		case '(':
			d = HDIR;
			break;
		case '[':
			d = VDIR;
			break;
		case '{':
			d = ZDIR;
			break;
		}
		r = getList(s, d, end_of_file);
	} else {
		s.putback(c);
		ostringstream os;
		while((s >> c) && !isWhitespace(c) && !isRightParen(c) && !isLeftParen(c)) {// && !s.eof()) {
			os << c;
			dbg.trace((string("tick") + os.str() + string("\n")).c_str());
		}
		s.putback(c);
		r = GSA.newExpression(os.str().c_str());
	}
	return r;
}




sPointer<Expression> Expression::getParent()
{
	assert(false);
	sPointer<Expression> dummy;
	return dummy;
}


