#pragma once
#include "pExp.h"
#include "Instruction.h"

namespace carin {
	/*
	 * When we first unroll the list we have to mark
	 * the members of the list as either 'evaluate'
	 * or 'do not evaluate' -- if it's a special form,
	 * in some cases, we do not evaluate arguments.
	 * but we need to keep ahold of the information
	 * as to whether it needs to be evaluated or not.
	 * so there's an initial step where we eval the first
	 * thing in the list to see if it's a function.  If so,
	 * we figure out which args get evaluated and which don't,
	 * and mark them as such, then we continue with evaluation.
	 */
	class Machine
	{
	private:
		list<Instruction>::iterator IP;
		list<Instruction> instructions;
		
	public:
		Machine();
		~Machine();
		void setup(sPtr top, Environment* e = 0);
		void step();
		void process();
		void collapse();
		void expandPair();
		void lexCurrent();
		void evalFirstPosition();
		void replaceSymbol();
		void applySkipVector();
		void debugList();
		bool finished();
		sPtr result();
		sPtr eval(sPtr top, Environment* e = 0);
	};
};
