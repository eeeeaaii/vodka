
/*
?
(begin ? ? ?)
(begin (define f1 ?) ? ?)
(begin (define f1 (lambda () ? ?)) ? ?)
(begin (define f1 <procedure>) ? ?)       --> in next step, add binding of f1=this procedure to global scope
(begin <done> ? ?)
(begin <done> (define f2 ?) ?)
(begin <done> (define f2 (lambda () ??)) ?)
(begin <done> (define f2 <procedure>) ?)  --> in next step, add binding of f2=the second procedure to global scope
(begin <done> <done> ?)
(begin <done> <done> (f2))  --> in next step, substitute code for f2
(begin <done> <done> ?)
(begin <done> <done> (begin ? ?))   --> all procedures have begin around their code
(begin <done> <done> (begin (define var 20) ?) --> in next step, add binding of var=20 to env. assoc. with this lambda (f2)
(begin <done> <done> (begin <done> (?)))
(begin <done> <done> (begin <done> ((f1)))) --> in next step, code for f1 procedure is plugged in
(begin <done> <done> (begin <done> ((begin ? ?))))
(begin <done> <done> (begin <done> ((begin (define var 10) ?)))) --> add binding of var=10 to env assoc w/ this lambda (f1)
(begin <done> <done> (begin <done> ((begin <done> ?))))
(begin <done> <done> (begin <done> ((begin <done> (lambda () ?)))))
(begin <done> <done> (begin <done> ((begin <done> <procedure>)))) --> in next step, f1 procedure returns
(begin <done> <done> (begin <done> (<procedure>)))
(begin <done> <done> (begin <done> (begin ?)))
(begin <done> <done> (begin <done> (begin var))) --> look up binding for var in f1, which has since disappeared from our temporary computation data structure!

(begin <done> <done> (begin <done> (begin 10)))
(begin <done> <done> (begin <done> 10))
(begin <done> <done> 10)
10

- every instr. has a pointer to an environment, which is the place it looks to resolve stuff
- so when we take the code for a procedure and plug the code into the instr. list, we create a new environment and give the root instruction (i.e. the begin) a pointer to it, which means "always and forever, when you look up a symbol, you look here for it".  The parent env. of that new env. is the env that the <procedure> object had.
- when we expand a ?, the children get the same target env. as the parent
- if a value is returned from a proc. (via collapse) it continues to point to the place where you told it to look to when it was created

-- only thing left is assignment.  If you assign a function to a variable, then later execute, it should retain the environment.



(begin
  (define f1
    (lambda ()
      (define var 10)
      (lambda ()
        var)))
  (define f2
    (lambda ()
      (define var 20)
      ((f1))))
  (f2)
)

;my new system separates the state of the computation from the code.
;name resolution of symbols is an attribute of the code
;but the values assigned to variables is an attribute of the state of the computation.
;my system dynamically builds a representation of the state of a computation
;from a data structure representing the code.
;my system also needs to build a representation of the variable-name-lookup structure
;and then populate that structure with values as the computation progresses
;the code has

?
(begin ? ? ? ?)
(begin (define f1 ?) ? ? ?)
(begin (define f1 (lambda () ? ?)) ? ? ?)
(begin (define f1 <procedure>) ? ? ?)   --> set f1 to equal that procedure
(begin <done> ? ? ?)
(begin <done> (define x '()) ? ?) --> set x to equal that
(begin <done> <done> ? ?)
(begin <done> <done> (set! x ?) ?)
(begin <done> <done> (set! x (f1)) ?)
(begin <done> <done> (set! x (<procedure>) ?)
(begin <done> <done> (set! x (begin ? ?)) ?)
(begin <done> <done> (set! x (begin (define var 10) ?)) ?)
(begin <done> <done> (set! x (begin <done> ?)) ?)
(begin <done> <done> (set! x (begin <done> (lambda () ?))) ?)
(begin <done> <done> (set! x (begin <done> <procedure>)) ?)
(begin <done> <done> (set! x <procedure>) ?)  --> sets x equal to that procedure, that procedure keeps its env. with it
(begin <done> <done> <done> ?)
(begin <done> <done> <done> (?))
(begin <done> <done> <done> ((lambda () ? ?)))
(begin <done> <done> <done> (<procedure>))
(begin <done> <done> <done> (begin ? ?))
(begin <done> <done> <done> (begin (define var 20) ?))
(begin <done> <done> <done> (begin <done> ?))
(begin <done> <done> <done> (begin <done> (x))) -->look up x and retrieve the procedure w/ its environment
(begin <done> <done> <done> (begin <done> (<procedure>)))
(begin <done> <done> <done> (begin <done> (begin ?)))
(begin <done> <done> <done> (begin <done> (begin var)))  --var is resolved using environment that stayed w/ x
(begin <done> <done> <done> (begin <done> 10))
(begin <done> <done> <done> 10)
10




(begin
  (define f1
    (lambda ()
      (define var 10)
      (lambda ()
        var)))
  (define x '())
  (set! x (f1))
  ((lambda ()
     (define var 20)
     (x))))


*/

#pragma once

#include "p_exp.h"
#include "environment.h"
#include <list>
#include <vector>

const int OPCODE_NOOP = 0;
const int OPCODE_STARTLIST = 1;
const int OPCODE_ENDLIST = 2;
const int OPCODE_PAIR = 3;
const int OPCODE_ATOM = 4;
const int OPCODE_PROCEDURE = 5;
const int OPCODE_SYMBOL = 6;
const int OPCODE_EVALUATED = 7;

/*
when you create a lambda object, you go up
until you find a containing OPCODE_ENVIRONMENT_START
-- that becomes the parent env. of the newly created
procedure object

when you resolve a symbol, you go up until you find
the 
*/

namespace whelk {
	class Instruction
	{
	private:
		sPtr p;
		int opcode;
		void setOpcode(int nopcode);
		Environment *env;
	public:
		Instruction();
		Instruction(int opcode);
		Instruction(int opcode, sPtr p);
		Instruction(sPtr p);
		~Instruction(void);
		Instruction(const Instruction& rhs);
		Instruction& operator=(const Instruction& rhs);
		int getOpcode();
		list<Instruction> getChildren();
		void lexCurrent();
		vector<bool> getSkipList();
		void replaceSymbol();
		string getText();
		Instruction evaluateProcedure(Environment *e, list<Instruction> args);
		sPtr getSptr();
		void setSkip(bool in);
		void skipCompleted();
		Environment *getEnvironment();
		void setEnvironment(Environment *e);
	};
};
