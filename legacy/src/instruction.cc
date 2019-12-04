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


#include "instruction.h"

#include "expression.h"
#include "pair.h"
#include "for_debugging.h"
#include "procedure.h"
#include "expression_factory.h"
#ifdef WINDOWS
#using <mscorlib.dll>
#endif

using namespace whelk;

Instruction::Instruction(int _opcode, sPointer<Expression> _p)
{
	opcode = _opcode;
	p = _p;
	env = 0;
}

Instruction::Instruction()
{
	opcode = OPCODE_NOOP;
	env = 0;
}

Instruction::Instruction(int _opcode)
{
	opcode = _opcode;
	env = 0;
}
Instruction::Instruction(sPointer<Expression> _p)
{
	p = _p;
	switch(p->getType()) {
	case XT_SYMBOL:
		opcode = OPCODE_SYMBOL;
		break;
	case XT_PROCEDURE:
		opcode = OPCODE_SYMBOL;
		break;
	case XT_PAIR:
		opcode = OPCODE_PAIR;
		break;
	default:
		opcode = OPCODE_ATOM;
		break;
	}
	env = 0;
}
Instruction::~Instruction(void)
{
}
Instruction::Instruction(const Instruction& in)
{
	opcode = in.opcode;
	p = in.p;
	env = in.env;
}
Instruction& Instruction::operator=(const Instruction& rhs)
{
	opcode = rhs.opcode;
	p = rhs.p;
	env = rhs.env;
	return *this;
}

sPointer<Expression> Instruction::getsPtr()
{
	return p;
}

int Instruction::getOpcode()
{
	return opcode;
}

void Instruction::setOpcode(int nopcode)
{
	opcode = nopcode;
}

// does not assume that the children are being used for
// anything in particular (does not put OPCODE_STARTLIST,
// OPCODE_ENDLIST, or OPCODE_FIRST_POSITION
// however -- environement of this instruction goes to
// env. of the children
list<Instruction> Instruction::getChildren()
{
	assert(opcode == OPCODE_PAIR);
	list<Instruction> tl;
	for (		sPointer<Expression> li = p
				;
				li->getType() != XT_NULL
				;
				li = ((Pair*)li)->getCdr()
		)
	{
		sPointer<Expression> ptmp = ((Pair*)li)->getCar();
		int opcode;
		if (ptmp->getType() == XT_PAIR) {
			opcode = OPCODE_PAIR;
		} else {
			opcode = OPCODE_ATOM;
		}
		Instruction newi(opcode, ptmp);
		tl.push_back(newi);
	}
	return tl;
}

void Instruction::lexCurrent()
{
	int type;
	type = p->getType();
	assert(type != XT_PAIR);
	ExpressionFactory ef;
	p = ef.create(p->getMytext(), p->getEnvironment());
	type = p->getType();
	if (type == XT_PROCEDURE) {
		opcode = OPCODE_PROCEDURE;
	} else if (type == XT_SYMBOL) {
		opcode = OPCODE_SYMBOL;
	} else {
		opcode = OPCODE_EVALUATED;
	}
}

void Instruction::replaceSymbol()
{
	string txt;
	txt = p->getMytext();
	sPointer<Code> boundCode = env->lookupBinding(txt);
	sPointer<Expression> boundto = (Expression*)boundCode.getP();
	if (!boundto) {
		assert(false);
	}
	p = boundto;
	if (p->getType() == XT_PROCEDURE) {
		env = p->getEnvironment();
	}
}

vector<bool> Instruction::getSkipList()
{
	vector<bool> b;
	((Procedure*)p)->getSkipList(b);
	return b;
}

void Instruction::setSkip(bool in)
{
	if (in) {
		setOpcode(OPCODE_EVALUATED);
	}
}

void Instruction::skipCompleted()
{
	setOpcode(OPCODE_EVALUATED);
}

Environment *Instruction::getEnvironment()
{
	if (p->getType() == XT_PROCEDURE) {
		return p->getEnvironment();
	}
	return env;
}

void Instruction::setEnvironment(Environment *e)
{
	env = e;
}


string Instruction::getText()
{
	if (opcode == OPCODE_STARTLIST) {
		return string("(");
	} else if (opcode == OPCODE_ENDLIST) {
		return string(")");
	} else {
		return string(p->getMytext());
	}
}

Instruction Instruction::evaluateProcedure(Environment *e, list<Instruction> args)
{
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wpotentially-evaluated-expression"
	if (typeid(*p) == typeid(Procedure)) { // if user-defined function
#pragma GCC diagnostic pop
		list<Instruction>::iterator lIiter;
		list<sPointer<Expression> > lsPargs;
		for (lIiter = args.begin() ; lIiter != args.end() ; lIiter++) {
			lsPargs.push_front(lIiter->p);
		}
		Procedure *procp;
		procp = ((Procedure*)p);
		procp->addBindings(e, lsPargs);
		sPointer<Expression> newp = procp->getCodeRoot();
		Instruction inst(newp);
		inst.setEnvironment(e);
		return inst;

	} else {
		vector<sPointer<Expression> > argv;
		list<Instruction>::iterator i;
		for (i = args.begin() ; i != args.end() ; i++) {
			argv.push_back(i->p);
		}
		sPointer<Expression> newp = ((Procedure*)p)->evalPrimitive(argv);
		return Instruction(OPCODE_EVALUATED, newp);
	}
}



