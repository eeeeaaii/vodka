
#include "ide_event_handler.h"

#include "p_exp.h"
#include "event.h"
#include "expression.h"
#include "storage_allocator.h"
#include "pair.h"
#include "machine.h"
#include "thing_holder.h"
#include "constants.h"

using namespace whelk::IDEHandler;

void IDEEventHandler::swapSelected(sPointer<Expression> a, sPointer<Expression> b)
{
	if (a->getSelected() == 1) {
		if (b->getIsTop() == false) {
			b->setSelected(1);
			a->setSelected(0);
		}
	} else if (b->getSelected() == 1) {
		if (a->getIsTop() == false) {
			b->setSelected(0);
			a->setSelected(1);
		}
	}
}


/*

  () - parent
  /\
 []() - exp, nextone

 -change to-

  () - parent
  /\
 []() - exp, newpair
   /\
  ()() - newexp, nextone

*/

void IDECreateNextSiblingHandler::notify(Event *e)
{
	sPointer<Expression> parent = exp->getParent();
	if (!parent) return;
	sPointer<Expression> nextone = PAIR(parent)->getCdr();
	sPointer<Expression> newexp = GSA.newExpression();
	sPointer<Expression> newpair = GSA.newPair(newexp, nextone);
	PAIR(parent)->setCdr(newpair);

	PAIR(newpair)->setDirection(PAIR(parent)->getDirection());
	PAIR(parent)->setDirtyness(PAIR(parent)->getDirtyness() | PAIR(parent)->getDirection());
	swapSelected(exp, newexp);
	exp = newexp;
}

/*
Doing this the "straightforward" way is complicated
because there are multiple cases (depending on whether
the parent is the grandparent's car or cdr)
so it's easier to do the same thing as CreateNext,
except there's the extra step where you SWITCH exp and newexp.
*/

void IDECreatePreviousSiblingHandler::notify(Event *e)
{
	sPointer<Expression> parent = exp->getParent();
	if (!parent) return;
	sPointer<Expression> nextone = PAIR(parent)->getCdr();
	sPointer<Expression> newexp = GSA.newExpression();
	sPointer<Expression> newpair = GSA.newPair(newexp, nextone);
	PAIR(parent)->setCdr(newpair);

	//extra step
	PAIR(parent)->setCar(newexp);
	PAIR(newpair)->setCar(exp);

	PAIR(newpair)->setDirection(PAIR(parent)->getDirection());
	PAIR(parent)->setDirtyness(PAIR(parent)->getDirtyness() | PAIR(parent)->getDirection());
	swapSelected(exp, newexp);
	exp = newexp;
}

/*

 ()  - parent
 /\
[]()  - exp, next

if next is null, we don't do anything, else

 ()  - parent
 /\
[]()  - exp, next
  /\
 ()   - newexp

*/
void IDEMoveNextSiblingHandler::notify(Event *e)
{
	sPointer<Expression> parent = exp->getParent();
	if (!parent) return;
	sPointer<Expression> next = PAIR(parent)->getCdr();
	if (!next) return;
	sPointer<Expression> newexp = PAIR(next)->getCar();
	swapSelected(exp, newexp);
	exp = newexp;
}

/*

case 1: we don't do anything

   () - gparent
   /\
  ()  - parent
  /\
 []  - exp

case 2:

 () - gparent
 /\
()() - newexp, parent
  /\
 []  - exp

*/

void IDEMovePreviousSiblingHandler::notify(Event *e)
{
	sPointer<Expression> parent = exp->getParent();
	if (!parent) return;
	sPointer<Expression> gparent = parent->getParent();
	if (!gparent) return;
	if (PAIR(gparent)->getCar() == parent) return; // return if case 1
	sPointer<Expression> newexp = PAIR(gparent)->getCar();
	swapSelected(exp, newexp);
	exp = newexp;
}

/*

  ()  - parent
  /\
 []()  - exp, next
 /\ 
()()   - firstchild, listfirst
  /\
   ...
     \
	 ()  - listlast
	  \
	  <> - (null)

first I stick firstchild into parent where exp was.

  ()  - parent
  /\
 ()()  - firstchild, next

 then

  ()  - parent
  /\
 ()()  - firstchild, listfirst
   /\ 
    ...
      \
      ()  - listlast
       \
       () - next

*/

void IDEDisbandHandler::notify(Event *e)
{
	if (!exp->isType(XT_PAIR)) return;
	sPointer<Expression> parent = exp->getParent();
	if (!parent) return;
	sPointer<Expression> next = PAIR(parent)->getCdr();
	sPointer<Expression> firstchild = PAIR(exp)->getCar();
	sPointer<Expression> listfirst = PAIR(exp)->getCdr();
	sPointer<Expression> listlast;
	for (
			listlast = listfirst ;
		   	!PAIR(listlast)->getCdr()->isType(XT_NULL) ;
			listlast = PAIR(listlast)->getCdr()
		);

	PAIR(parent)->setCar(firstchild);
	PAIR(parent)->setCdr(listfirst);
	PAIR(listlast)->setCdr(next);
	// ugh
	parent->setDirtyness(HDIR | VDIR | ZDIR);
	// set the direction
	Direction parentdirection = PAIR(parent)->getDirection();
	for (
			sPointer<Expression> dirptr = listfirst;
			dirptr != next;
			dirptr = PAIR(dirptr)->getCdr()
		) {
		PAIR(dirptr)->setDirection(parentdirection);
	}

	swapSelected(exp, parent);
	exp = parent;
}

/*

start out this way:

   () - newexpparent
   /\
    ()   - newexp
    /\
   []  - exp

when it gets like this, we stop:

  ()  - newexpparent
  /
 ()  - newexp
 /\
  ...
    \
    ()  
    /\
   []  - exp

*/
void IDEMoveOutHandler::notify(Event *e)
{
	sPointer<Expression> newexp = exp->getParent();
	if (!newexp) return;
	sPointer<Expression> newexpparent;
	for (
			newexpparent = newexp->getParent();
			!!newexpparent && PAIR(newexpparent)->getCdr() == newexp;
			newexp = newexpparent, newexpparent = newexp->getParent()
		);
	if (!newexpparent) return;

	PAIR(newexpparent)->setCachedChild(exp);
	swapSelected(exp, newexp);
	exp = newexp;
}

/*

   () - parent
   /\
  []   - exp

  we make a new list, put exp in it, and

   () - parent
   /\
  ()   - newlist
  /\  
 []<>   - exp, (null)


*/
void IDEEnlistHandler::notify(Event *e)
{
	sPointer<Expression> parent = exp->getParent();
	if (!parent) return;

	sPointer<Expression> newlist = GSA.newPair(exp, GSA.newNull());
	PAIR(parent)->setCar(newlist);

	parent->setDirtyness(HDIR|VDIR|ZDIR);
}

/*

  ()  - exp
  /\
   ...
     \
     /\
    ()    - cachedchild

*/

void IDEMoveInHandler::notify(Event *e)
{
	sPointer<Expression> cachedchild = PAIR(exp)->getCachedChild();
	swapSelected(exp, cachedchild);
	exp = cachedchild;
}

/*

  ()  - parent
  /\
 []  - exp

  replace exp with result of evaluation

*/

void IDEEvalHandler::notify(Event *e)
{
	sPointer<Expression> parent = exp->getParent();
	if (!parent) return;
	sPointer<Expression> result;

	Machine m;
	m.setup(exp);
	m.process();
	result = m.result();

	PAIR(parent)->setCar(result);
	swapSelected(exp, result);
	exp = result;
}

/*

   []  - exp/expi
   /\
    () - expi
	 \
	 ...
	   \
	   <>

*/
void IDEPivotHandler::notify(Event *e)
{
	if (!exp->isType(XT_PAIR)) return; 
	sPointer<Expression> expi;
	for (expi = exp ; !expi->isType(XT_NULL) ; exp = PAIR(expi)->getCdr()) {
		Direction currentdirection, newdirection;
		currentdirection = PAIR(expi)->getDirection();
		switch(currentdirection) {
		case HDIR:
			newdirection = VDIR;
			break;
		case VDIR:
			newdirection = ZDIR;
			break;
		case ZDIR:
			newdirection = HDIR;
			break;
		}
		PAIR(expi)->setDirection(newdirection);
		expi->setDirtyness(HDIR|VDIR|ZDIR);
	}
}

/*

case 1:
 
   ()  - gparent
   /\
  ()   - parent
  /\
 []()   - exp, next

 in this case, set gparent.car = next

case 2:


  () - gparent
  /\
 ()()  - newexp, parent
   /\
  []()  - exp, next

  in this case, set gparent.cdr = next

*/ void IDEDeleteNodeHandler::notify(Event *e)
{
	sPointer<Expression> parent = exp->getParent();
	if (!parent) return;
	sPointer<Expression> gparent = parent->getParent();
	if (!gparent) return;
	sPointer<Expression> next = PAIR(parent)->getCdr();
	sPointer<Expression> newexp = PAIR(gparent)->getCar(); // could == parent

	if (PAIR(gparent)->getCar() == parent) {
		PAIR(gparent)->setCar(next);
	} else if (PAIR(gparent)->getCdr() == parent) {
		PAIR(gparent)->setCdr(next);
	} else assert(false);

	swapSelected(newexp, exp);
	exp = newexp;
}

void IDEKeyTypedHandler::notify(Event *e)
{
	if (exp->isType(XT_PAIR)) return;
	char buf[3];
	sprintf(buf, "%c", e->getKeyvalue());
	string mt = "";
	if (!exp->isType(XT_UNKNOWN) && !exp->isType(XT_NULL)) { 
		mt += exp->getMytext();
	}
	mt += buf;
	exp->setMytext(mt);
	exp->setDirtyness(exp->getDirtyness()|HDIR);
}

void IDERuboutHandler::notify(Event *e)
{
	string mt = exp->getMytext();
	if (mt.size() > 0) {
		mt = mt.substr(0, mt.size() - 1);
		exp->setMytext(mt);
	}
	exp->setDirtyness(exp->getDirtyness() | HDIR);
}


