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


#include "machine.h"

#include "expression.h"
#include "pair.h"
#include "for_debugging.h"
#include "procedure.h"
#include "storage_manager.h"

#ifdef WINDOWS
#using <mscorlib.dll>
#endif

using namespace whelk;

Machine::Machine()
{
}

Machine::~Machine()
{
}

sPointer<Expression> Machine::eval(sPointer<Expression> top, Environment *e)
{
	setup(top, e);
	process();
	return result();
}

void Machine::setup(sPointer<Expression> top, Environment *e)
{
	if (e == 0) {
		e = GSA.getGlobalEnvironment();
	}
	Instruction i(top);
	i.setEnvironment(e);
	instructions.push_front(i);
	IP = instructions.begin();
}

void Machine::process()
{
	while(!finished()) {
		step();
	}
}

bool Machine::finished()
{
	return (instructions.size() == 1 && IP->getOpcode() == OPCODE_EVALUATED);
}

sPointer<Expression> Machine::result()
{
	return (*(instructions.begin())).getsPtr();
}

void Machine::step()
{
	// fetch the next instruction
	debugList();
	int opcode = IP->getOpcode();
	switch(opcode) {
		case OPCODE_STARTLIST:
		case OPCODE_EVALUATED:
		case OPCODE_NOOP:
			IP++;
			break;
		case OPCODE_ENDLIST:
			collapse();
			break;
		case OPCODE_PAIR:
			expandPair();
			break;
		case OPCODE_PROCEDURE:
			applySkipVector();
			break;
		case OPCODE_SYMBOL:
			replaceSymbol();
			break;
		case OPCODE_ATOM:
			lexCurrent();
			break;
	}
}

/* void collapse()
 *
 * This procedure walks backward up the main list in the
 * "instructions" variable and accumulates the function
 * arguments into another list.  Then we actually invoke
 * the procedure, passing it these arguments.  Finally
 * we insert the result of the procedure call into the main
 * list (instructions) in the place where the procedure call
 * used to be.
 *
 * Notes:
 * 1. before I walk up the list, I erase the first expression
 *    I see because it is always OPCODE_ENDLIST.
 * 2. once I have the list of arguments, I erase what IP is pointing
 *    to because it's pointing to OPCODE_STARTLIST
 * 3. the first element of the args list is the procedure -- I
 *    extract this and erase it from the list of args.
 *
 */

void Machine::collapse()
{
	list<Instruction> args;
	for (
		(IP = instructions.erase(IP)), IP--
		;
		IP->getOpcode() != OPCODE_STARTLIST
		;
		(IP = instructions.erase(IP)), IP--)
	{
		args.push_front(*IP);
	}
	IP = instructions.erase(IP);
	Instruction procedure_instruction = *args.begin();
	args.erase(args.begin());
	Environment *e = new Environment(procedure_instruction.getEnvironment());
	Instruction result = procedure_instruction.evaluateProcedure(e, args);
	IP = instructions.insert(IP, result);

}

/* void expandPair()
 *
 * The purpose of this function is to replace an instruction that
 * contains a list-head pair with a series of instructions, one for each
 * expression in the list
 *
 * Notes:
 * 1. the getChildren method of Instruction just retrieves the children
 *    if the instruction points to a pair.  This function has to do all
 *    the rest of the necessary bookkeeping (i.e. putting in OPCODE_STARTLIST,
 *    OPCODE_ENDLIST, etc)
 * 2. Instruction::getChildren automatically propagates the Environment
 *    of the parent to the children.
 * 3. Calling instructions.splice actually removes all elements from the
 *    temporary "tl" list, but any iterators pointing to any elements of it
 *    remain valid.  Since after the function is over, we want IP to point to
 *    the first element in "tl", we obtain an iterator pointing to it before
 *    we do the splice.
 */
void Machine::expandPair()
{
	list<Instruction> tl = IP->getChildren();
	list<Instruction>::iterator it;
	it = tl.begin();
	tl.push_front(Instruction(OPCODE_STARTLIST));
	tl.push_back(Instruction(OPCODE_ENDLIST));
	it = tl.begin();
	IP = instructions.erase(IP);
	instructions.splice(IP, tl);
	IP = it;
}

// tell the current instruction to evaluate the expression it points to
// not used for pairs!
void Machine::lexCurrent()
{
	IP->lexCurrent();
}

void Machine::replaceSymbol()
{
	IP->replaceSymbol();
}


// retrieve a list of boolean values from the instruction
// that says whether the arguments to a given function
// should be skipped.  For special forms, the arguments
// are often not evaluted, e.g. (let ((x)) x).  This function
// iterates over the booleans and changes the opcode
// for every instruction corresponding to a skip "order"
void Machine::applySkipVector()
{
	vector<bool> skiplist;
	skiplist = IP->getSkipList();

	list<Instruction>::iterator pos = IP;
	// of course we start at the instruction AFTER ip.
	pos++;
	for (vector<bool>::iterator i = skiplist.begin() ; i != skiplist.end() ; i++, pos++) {
		pos->setSkip(*i);
	}
	IP->skipCompleted();
}

// debugging function that prints out the contents
// of the instruction array
void Machine::debugList()
{
	list<Instruction>::iterator i;
	dbg.trace("-----------\n");
	for (i = instructions.begin() ; i != instructions.end() ; i++) {
		string debug;
		if (i == IP) {
			debug += "+";
		} else {
			debug += " ";
		}
		switch ((*i).getOpcode()) {
			case OPCODE_STARTLIST:
				debug += "START";
				break;
			case OPCODE_ENDLIST:
				debug += "END";
				break;
			case OPCODE_PAIR:
				debug += "PAIR";
				break;
			case OPCODE_ATOM:
				debug += "ATOM";
				break;
			case OPCODE_PROCEDURE:
				debug += "PROCEDURE";
				break;
			case OPCODE_SYMBOL:
				debug += "SYMBOL";
				break;
			case OPCODE_EVALUATED:
				debug += "EVALUATED";
				break;
		}
		debug += " ";
		debug += i->getText();
		debug += "\n";
		dbg.trace(debug);
	}
}
