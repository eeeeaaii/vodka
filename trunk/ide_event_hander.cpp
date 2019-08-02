#include "Carin.h"
#include "IDEEventHandler.h"

#include "pExp.h"
#include "Event.h"
#include "Expression.h"
#include "StorageManager.h"
#include "Pair.h"
#include "Machine.h"
#include "ThingHolder.h"

using namespace IDEHandler;


void IDEEventHandler::swapSelected(sPtr a, sPtr b)
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
	sPtr parent = exp->getParent();
	if (!parent) return;
	sPtr nextone = PAIR(parent)->getCdr();
	sPtr newexp = GSM.newExpression();
	sPtr newpair = GSM.newPair(newexp, nextone);
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
	sPtr parent = exp->getParent();
	if (!parent) return;
	sPtr nextone = PAIR(parent)->getCdr();
	sPtr newexp = GSM.newExpression();
	sPtr newpair = GSM.newPair(newexp, nextone);
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
	sPtr parent = exp->getParent();
	if (!parent) return;
	sPtr next = PAIR(parent)->getCdr();
	if (!next) return;
	sPtr newexp = PAIR(next)->getCar();
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
	sPtr parent = exp->getParent();
	if (!parent) return;
	sPtr gparent = parent->getParent();
	if (!gparent) return;
	if (PAIR(gparent)->getCar() == parent) return; // return if case 1
	sPtr newexp = PAIR(gparent)->getCar();
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
	sPtr parent = exp->getParent();
	if (!parent) return;
	sPtr next = PAIR(parent)->getCdr();
	sPtr firstchild = PAIR(exp)->getCar();
	sPtr listfirst = PAIR(exp)->getCdr();
	sPtr listlast;
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
			sPtr dirptr = listfirst;
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
	sPtr newexp = exp->getParent();
	if (!newexp) return;
	sPtr newexpparent;
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
	sPtr parent = exp->getParent();
	if (!parent) return;

	sPtr newlist = GSM.newPair(exp, GSM.newNull());
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
	sPtr cachedchild = PAIR(exp)->getCachedChild();
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
	sPtr parent = exp->getParent();
	if (!parent) return;
	sPtr result;

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
	sPtr expi;
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
	sPtr parent = exp->getParent();
	if (!parent) return;
	sPtr gparent = parent->getParent();
	if (!gparent) return;
	sPtr next = PAIR(parent)->getCdr();
	sPtr newexp = PAIR(gparent)->getCar(); // could == parent

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


void ThingHolder::setupHandlers()
{
	sPtr sel;
	sel = ((Pair*)top)->getCar();
	setupHandler(new IDECreateNextSiblingHandler(sel));
	setupHandler(new IDECreateNextSiblingHandler(sel));
	setupHandler(new IDECreatePreviousSiblingHandler(sel));
	setupHandler(new IDEMoveNextSiblingHandler(sel));
	setupHandler(new IDEMovePreviousSiblingHandler(sel));
	setupHandler(new IDEDisbandHandler(sel));
	setupHandler(new IDEMoveOutHandler(sel));
	setupHandler(new IDEEnlistHandler(sel));
	setupHandler(new IDEMoveInHandler(sel));
	setupHandler(new IDEEvalHandler(sel));
	setupHandler(new IDEPivotHandler(sel));
	setupHandler(new IDEDeleteNodeHandler(sel));
	setupHandler(new IDEKeyTypedHandler(sel));
	setupHandler(new IDERuboutHandler(sel));
}

