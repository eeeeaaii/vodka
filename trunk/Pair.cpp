#include "Carin.h"
#include ".\pair.h"
#include "StorageManager.h"
#include "EvalException.h"
#include "GraphicsContext.h"
#include "EventHandler.h"
#include "ForDebugging.h"
#include "Procedure.h"
#include "Environment.h"

VIRTUAL_CONSTRUCTOR(Pair);

int Pair::cdrmarg = 8;
int Pair::boxmarg = 3;

Pair::Pair(sPtr ncar, sPtr ncdr)
{
	assert(!!ncar || !!ncdr);
	car = ncar;
	cdr = ncdr;
	type = XT_PAIR;
	mytext = "{pair}";
	imagepair = false;
	collapsed = false;
	direction = HDIR;
	setDirtyness(HDIR | VDIR | ZDIR);
}


Pair::Pair(void)
{
	type = XT_PAIR;
	mytext = "{pair}";
	imagepair = false;
	collapsed = false;
	direction = HDIR;
}

Pair::~Pair(void)
{
}


Direction Pair::getDirection()
{
	return direction;
}
void Pair::setDirection(Direction d)
{
	direction = d;
}


void Pair::setCar(sPtr nc)
{
	car = nc;
}
void Pair::setCdr(sPtr nc) {
	cdr = nc;
}
sPtr Pair::getCar()
{
	return car;
}
sPtr Pair::getCdr()
{
	return cdr;
}

sPtr Pair::copystate(sPtr n)
{
	((Pair*)n)->setCar(getCar()->dupe());
	((Pair*)n)->setCdr(getCdr()->dupe());

	return Expression::copystate(n);
}

Delta Pair::draw(GraphicsContext *grcon)
{

	// if it's a pair, then
	// 1. if it's an imagepair, you just draw the car, then draw the cdr.
	// 2. if not, you have to do some special stuff.
	//    what special stuff do I need to draw?
	//    - put space in between siblings, but not after last sibling
	//    - draw margin around all stuff inside a whole list
	//    - draw a box around every list
	Delta d;
	Point p;
	dbg.trace("%d: drawing pair\n");
	p = grcon->popOrigin();
	if (collapsed) {
		assert(false);
		return d;
	} else if (imagepair) {
		dbg.trace("%d: this pair is an image, drawing without margins.\n");
		Delta dcar, dcdr;
		// the origin of the car of a pair
		// is always the same as the origin of the cdr of the pair.
		// the origin we pass to the cdr of the pair
		// depends on whether the pair is H or V.
		// if H, it's origin.x + width(car)
		// if V, it's origin.y + height(car)
		grcon->pushOrigin(p);
		dcar = getCar()->draw(grcon);
		dbg.trace("%d: dcar = %d,%d\n");
		if (direction == HDIR) {
			p.x += dcar.dx;
		} else if (direction == VDIR) {
			p.y += dcar.dy;
		} else {
			// no-op for ZDIR
		}
		grcon->pushOrigin(p);
		dcdr = getCdr()->draw(grcon);
		dbg.trace("%d: dcdr = %d,%d\n");
		// if I am a horizontal list,
		// then my delta x is width(car) + width(cdr)
		// and my delta y is (max(height(car), height(cdr))
		switch(direction) {
		case HDIR:
			d.dx = dcar.dx + dcdr.dx;
			d.dy = max(dcar.dy, dcdr.dy);
			break;
		case VDIR:
			d.dx = max(dcar.dx, dcdr.dx);
			d.dy = dcar.dy + dcdr.dy;
			break;
		case ZDIR:
			d.dx = max(dcar.dx, dcdr.dx);
			d.dy = max(dcar.dy, dcdr.dy);
			break;
		}
	} else {
		dbg.trace("%d: this pair is not an image, drawing with margins.\n");
		Delta dcar, dcdr;
		int cmarg;
		cmarg = (getCdr()->isType(XT_NULL)) ? 0 : cdrmarg;
		// we can't call isType because types may not be resolved.
		// but we don't have to determine type:
		// if it's unknown, it's NOT a pair.
		if (!getCar()->isType(XT_UNKNOWN) && getCar()->isType(XT_PAIR)) {
			dbg.trace("%d: The car of this pair is a list head.  We have to draw a box around it.\n");
			// car is a list.  We have to draw the box.
			int w, h;
			Point p2;
			w = getCar()->getWidth(grcon) + 2 * boxmarg;
			h = getCar()->getHeight(grcon) + 2 * boxmarg;
			p2.x = p.x + boxmarg;
			p2.y = p.y + boxmarg;
			if (getCar()->getSelected()) {
				grcon->drawSelectedRect(p.x, p.y, w, h);
			} else {
				grcon->drawUnselectedRect(p.x, p.y, w, h, ((Pair*)getCar())->getDirection());
			}
			grcon->pushOrigin(p2);
			dcar = getCar()->draw(grcon);
			dcar.dx += 2 * boxmarg;
			dcar.dy += 2 * boxmarg;
		} else {
			grcon->pushOrigin(p);
			dcar = getCar()->draw(grcon);
		}
		dbg.trace("%d: dcar= %d,%d\n");
		if (direction == HDIR) {
			p.x += dcar.dx + cmarg;
		} else if (direction == VDIR) {
			p.y += dcar.dy + cmarg;
		} else {
			// no-op for ZDIR
		}
		if (!getCdr()->isType(XT_NULL)) {
			grcon->pushOrigin(p);
			dcdr = getCdr()->draw(grcon);
			dbg.trace("%d: dcdr= %d,%d\n");
		}
		switch(direction) {
		case HDIR:
			d.dx = dcar.dx + dcdr.dx + cmarg;
			d.dy = max(dcar.dy, dcdr.dy);
			break;
		case VDIR:
			d.dx = max(dcar.dx, dcdr.dx);
			d.dy = dcar.dy + dcdr.dy + cmarg;
			break;
		case ZDIR:
			d.dx = max(dcar.dx, dcdr.dx);
			d.dy = max(dcar.dy, dcdr.dy);
			break;
		}
		dbg.trace("%d: d = %d,%d\n");
	}
	return d;
}

int Pair::getWidth(GraphicsContext *grcon)
{
	int w = 0;
	if (collapsed) {
		assert(false);
		return 0;
	} else {
		if (getDirtyness() & HDIR) {
			dbg.trace("%d: recalculating width for pair\n");
			if (direction == HDIR) {
				int bmarg = 0;
				int cmarg = 0;
				if (getCar()->isType(XT_PAIR)) {
					bmarg = boxmarg * 2;
				}
				if (!getCdr()->isType(XT_NULL)) {
					cmarg = cdrmarg;
				}
				w += getCar()->getWidth(grcon);
				if (!getCdr()->isType(XT_NULL)) {
					w += getCdr()->getWidth(grcon);
				}
				w += cmarg;
				w += bmarg;
				setDirtyness(getDirtyness() & (VDIR|ZDIR));
				cached_width = w;
				return cached_width;
			} else {
				setDirtyness(getDirtyness() & (VDIR|ZDIR));
				cached_width = max(
					(getCar()->getWidth(grcon) + (getCar()->isType(XT_PAIR) ? (boxmarg * 2) : 0)),
					getCdr()->getWidth(grcon)
					);
				return cached_width;
			}
		} else {
			dbg.trace("%d: using cached width for pair\n");
			return cached_width;
		}
	}
}

int Pair::getHeight(GraphicsContext *grcon)
{
	int h = 0;
	if (collapsed) {
		assert(false);
		return 0;
	} else {
		if (getDirtyness() & VDIR) {
			dbg.trace("%d: recalculating height for pair\n");
			if (direction == VDIR) {
				int bmarg = 0;
				int cmarg = 0;
				if (getCar()->isType(XT_PAIR)) {
					bmarg = boxmarg * 2;
				}
				if (!getCdr()->isType(XT_NULL)) {
					cmarg = cdrmarg;
				}
				h += getCar()->getHeight(grcon);
				if (!getCdr()->isType(XT_NULL)) {
					h += getCdr()->getHeight(grcon);
				}
				h += cmarg;
				h += bmarg;
				setDirtyness(getDirtyness() & (HDIR|ZDIR));
				cached_height = h;
				return cached_height;
			} else {
				setDirtyness(getDirtyness() & (HDIR|ZDIR));
				cached_height = max(
					(getCar()->getHeight(grcon) + (getCar()->isType(XT_PAIR) ? (boxmarg * 2) : 0)),
					getCdr()->getHeight(grcon)
					);
				return cached_height;
			}
		} else {
			dbg.trace("%d: using cached height for pair\n");
			return cached_height;
		}
	} 
}



sPtr Pair::getCachedChild()
{
	if (!cachedchild) {
		return getCar();
	} else return cachedchild;
}
void Pair::setCachedChild(sPtr n)
{
	cachedchild = n;
}

void Pair::setImagepair(bool b) {
	imagepair = b;
}

string Pair::toString(bool isFirst)
{
	string s("");
	if (isFirst) {
		switch(getDirection()) {
		case HDIR:
			s += "("; break;
		case VDIR:
			s += "["; break;
		case ZDIR:
			s += "{"; break;
		}
	}
	sPtr mycar;
	mycar = getCar();
	s += mycar->toString(mycar->isType(XT_PAIR));
	if (getCdr()->isType(XT_NULL)) {
		switch(getDirection()) {
		case HDIR:
			s += ")"; break;
		case VDIR:
			s += "]"; break;
		case ZDIR:
			s += "}"; break;
		}
	} else {
		s += " ";
		s += getCdr()->toString();
	}
	return s;
}

