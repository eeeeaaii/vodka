#include "carin.h"
#include "instruction.h"

#include "expression.h"
#include "pair.h"
#include "for_debugging.h"
#include "procedure.h"
#include "expression_factory.h"
#using <mscorlib.dll>

Instruction::Instruction(int _opcode, sPtr _p)
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
Instruction::Instruction(sPtr _p)
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

sPtr Instruction::getSptr()
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
	for (		sPtr li = p
				;
				li->getType() != XT_NULL
				;
				li = ((Pair*)li)->getCdr()
		)
	{
		sPtr ptmp = ((Pair*)li)->getCar();
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
	sPtr boundto;
	string txt;
	txt = p->getMytext();
	boundto = env->lookupBinding(txt);
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
	if (typeid(*p) == typeid(Procedure)) { // if user-defined function
		list<Instruction>::iterator lIiter;
		list<sPtr> lsPargs;
		for (lIiter = args.begin() ; lIiter != args.end() ; lIiter++) {
			lsPargs.push_front(lIiter->p);
		}
		Procedure *procp;
		procp = ((Procedure*)p);
		procp->addBindings(e, lsPargs);
		sPtr newp = procp->getCodeRoot();
		Instruction inst(newp);
		inst.setEnvironment(e);
		return inst;

	} else {
		vector<sPtr> argv;
		list<Instruction>::iterator i;
		for (i = args.begin() ; i != args.end() ; i++) {
			argv.push_back(i->p);
		}
		sPtr newp = ((Procedure*)p)->evalPrimitive(argv);
		return Instruction(OPCODE_EVALUATED, newp);
	}
}




