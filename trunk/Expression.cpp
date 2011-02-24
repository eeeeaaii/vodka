#include "Carin.h"
#include "Expression.h"
#include "EvalException.h"
#include "StorageManager.h"
#include "Procedure.h"
#include "Environment.h"
#include "GraphicsContext.h"
#include "Event.h"
#include "EventHandler.h"
#include "IDEEventHandler.h"
#include "Bitmap.h"
#include "Image.h"
#include "Pair.h"
#include "Environment.h"
#include "ForDebugging.h"


Expression::Expression(string mt)
{
	mytext = mt;
	initialize();
}
Expression::Expression()
{
	mytext = "";
	initialize();
}

void Expression::initialize()
{
	type = XT_UNKNOWN;
	id = nextID++;
	isTop = false;
	cached_width = 0;
	cached_height = 0;
	selected = 0;
	dirtyness = (HDIR | VDIR | ZDIR);
	env = 0;
	setEnvironment(GSM.getGlobalEnvironment());
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

sPtr Expression::copystate(sPtr n)
{
	n->setType(getType());
	n->setMytext(getMytext());
	return n;
	// don't think these are important.
//	n->setDirtyness(getDirtyness());
//	n->setCachedWidth(getCachedWidth());
//	n->setCachedHeight(getCachedHeight());
}

sPtr Expression::dupe()
// overridden in class Pair
// overridden in class Image
{
	// this function clones this Expression
	// newobj is a form of "Virtual Constructor"
	// see Stroustrop, "The C++ Programming Language", pg. 424
	sPtr newme = newobj();
	return copystate(newme);
}

sPtr Expression::newobj() 
{
   	return GSM.createExp(new Expression()); 
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
	sPtr p(this);
	while (!p->isType(XT_NULL)) {
		assert(p->isType(XT_PAIR));
		i++;
		p = ((Pair*)p)->getCdr();
	}
	return i; // for now, we assume it's a proper list
}

sPtr Expression::lastSibling()
{
	assert(isType(XT_PAIR));
	sPtr p(this);
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

sPtr Expression::getList(istream& s, Direction dir, bool& end_of_file)
{
	char c;
	sPtr r;
	dbg.trace("getting list\n");
	while((s >> c) && c == ' ');
	if (!isRightParen(c)) {
		s.putback(c);
		sPtr p1 = parseFromStream(s, end_of_file);
		sPtr p2 = getList(s, dir, end_of_file);
		r = GSM.newPair(p1, p2);
		((Pair*)r)->setDirection(dir);
	} else {
		r = GSM.newNull();
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

sPtr Expression::parseFromStream(istream& s, bool& end_of_file)
{
	char c;
	sPtr r;

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
		r = GSM.newExpression(os.str().c_str());
	}
	return r;
}



int Expression::getID()
{
	return id;
}

int Expression::nextID = 1;



sPtr Expression::getParent()
{
	assert(false);
	sPtr dummy;
	return dummy;
}


