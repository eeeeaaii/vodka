#pragma once

#include "p_exp.h"
#include "expression.h"
#include <vector>
#include <string>

#define SPECIAL_FORM_DECLARATION(X) \
\
class X : public Procedure \
{ \
public: \
	sPtr apply(); \
	void getPrototype(vector<int>& prototype); \
	virtual sPtr newobj() { return GSM.createExp(new X()); } \
};

#define BUILTIN_PROCEDURE_DECLARATION(X) \
class X : public Procedure \
{ \
	public: \
	sPtr apply(); \
	void getPrototype(vector<int>& prototype); \
	virtual sPtr newobj() { return GSM.createExp(new X()); } \
};

namespace whelk {

	class Procedure : public Expression
	{
	private:
		bool varargs;
		vector<string> formals;
		string listformal;
	protected:
		sPtr code;
		vector<sPtr> argvector;
	public:
		Procedure();
		Procedure(sPtr code);
		virtual ~Procedure();

		void			addBindings(Environment *e, list<sPtr> args);
		void			addFormal(string f);
		void			addListFormal(string f);
		vector<string>	getFormals();
		void			setArgs(sPtr args);
		virtual sPtr	apply();
		virtual void	checkNumArgs();
		virtual void	checkArgTypes();
		void			setCode(sPtr code);
		virtual void	getPrototype(vector<int>& prototype);
		virtual void	getSkipList(vector<bool>& skiplist);
		sPtr			getTailExpression(sPtr fromcode);
		int				argPromote();
		sPtr			promoteToLevel(sPtr n, int level);
		virtual sPtr newobj() { return GSM.createExp(new Procedure()); }
		virtual sPtr copystate(sPtr n);
		sPtr			evalPrimitive(vector<sPtr> argv);
		sPtr			getCodeRoot();

		int				numArgs();
		sPtr			arg(int);
		void			setArg(int, sPtr);


	};

	/************* SPECIAL FORMS ***************/
	namespace builtins {

		SPECIAL_FORM_DECLARATION(Define)
		SPECIAL_FORM_DECLARATION(Lambda)
		SPECIAL_FORM_DECLARATION(React)
		SPECIAL_FORM_DECLARATION(Quote)
		SPECIAL_FORM_DECLARATION(If)
		SPECIAL_FORM_DECLARATION(SetE)
		SPECIAL_FORM_DECLARATION(Cond)
		SPECIAL_FORM_DECLARATION(Rect)

		class Gquote : public Procedure
		{
			public:
			sPtr apply();
			//void evalArgs();
			void getPrototype(vector<int>& prototype);
			// special for this procedure
			sPtr gquote_rec(sPtr arg);
		};

		class Let : public Procedure
		{
		public:
			sPtr apply();
			//void evalArgs();
			void getPrototype(vector<int>& prototype);
			// special for this procedure
			void validateArguments();
		};

		/************* BUILTIN PROCEDURES ***************/
		BUILTIN_PROCEDURE_DECLARATION(Car)
		BUILTIN_PROCEDURE_DECLARATION(Cdr)
		BUILTIN_PROCEDURE_DECLARATION(Cons)
		BUILTIN_PROCEDURE_DECLARATION(EqvQ)
		BUILTIN_PROCEDURE_DECLARATION(EqQ)
		BUILTIN_PROCEDURE_DECLARATION(Import)
		BUILTIN_PROCEDURE_DECLARATION(Begin)
		BUILTIN_PROCEDURE_DECLARATION(String_Length)
		BUILTIN_PROCEDURE_DECLARATION(And)
		BUILTIN_PROCEDURE_DECLARATION(Or)
		BUILTIN_PROCEDURE_DECLARATION(NumberQ)
		BUILTIN_PROCEDURE_DECLARATION(IntegerQ)
		BUILTIN_PROCEDURE_DECLARATION(PairQ)
		BUILTIN_PROCEDURE_DECLARATION(SymbolQ)
		BUILTIN_PROCEDURE_DECLARATION(CharQ)
		BUILTIN_PROCEDURE_DECLARATION(StringQ)
		BUILTIN_PROCEDURE_DECLARATION(ProcedureQ)
		BUILTIN_PROCEDURE_DECLARATION(Set_CarE)
		BUILTIN_PROCEDURE_DECLARATION(Set_CdrE)
		BUILTIN_PROCEDURE_DECLARATION(CharE)
		BUILTIN_PROCEDURE_DECLARATION(CharLT)
		BUILTIN_PROCEDURE_DECLARATION(CharGT)
		BUILTIN_PROCEDURE_DECLARATION(CharLTE)
		BUILTIN_PROCEDURE_DECLARATION(CharGTE)
		BUILTIN_PROCEDURE_DECLARATION(String_Number)
		BUILTIN_PROCEDURE_DECLARATION(Number_String)
		BUILTIN_PROCEDURE_DECLARATION(String_Symbol)
		BUILTIN_PROCEDURE_DECLARATION(Symbol_String)
		BUILTIN_PROCEDURE_DECLARATION(Char_Integer)
		BUILTIN_PROCEDURE_DECLARATION(Integer_Char)
		BUILTIN_PROCEDURE_DECLARATION(Make_String)
		BUILTIN_PROCEDURE_DECLARATION(String_Ref)
		BUILTIN_PROCEDURE_DECLARATION(String_SetE)
		BUILTIN_PROCEDURE_DECLARATION(Apply)
		BUILTIN_PROCEDURE_DECLARATION(Eval)
		BUILTIN_PROCEDURE_DECLARATION(Input_PortQ)
		BUILTIN_PROCEDURE_DECLARATION(Output_PortQ)
		BUILTIN_PROCEDURE_DECLARATION(Open_Input_File)
		BUILTIN_PROCEDURE_DECLARATION(Open_Output_File)
		BUILTIN_PROCEDURE_DECLARATION(Close_Input_Port)
		BUILTIN_PROCEDURE_DECLARATION(Close_Output_Port)
		BUILTIN_PROCEDURE_DECLARATION(Read_Char)
		BUILTIN_PROCEDURE_DECLARATION(Peek_Char)
		BUILTIN_PROCEDURE_DECLARATION(Eof_ObjectQ)
		BUILTIN_PROCEDURE_DECLARATION(Write_Char)
		BUILTIN_PROCEDURE_DECLARATION(Open_Client_Port)
		BUILTIN_PROCEDURE_DECLARATION(Open_Server_Port)
		BUILTIN_PROCEDURE_DECLARATION(WidthQ)
		BUILTIN_PROCEDURE_DECLARATION(HeightQ)
		BUILTIN_PROCEDURE_DECLARATION(Color_AtQ)



		namespace math {
			BUILTIN_PROCEDURE_DECLARATION(Add)
			BUILTIN_PROCEDURE_DECLARATION(Subtract)
			BUILTIN_PROCEDURE_DECLARATION(Multiply)
			BUILTIN_PROCEDURE_DECLARATION(Divide)
			BUILTIN_PROCEDURE_DECLARATION(E)
			BUILTIN_PROCEDURE_DECLARATION(GT)
			BUILTIN_PROCEDURE_DECLARATION(GTE)
			BUILTIN_PROCEDURE_DECLARATION(LT)
			BUILTIN_PROCEDURE_DECLARATION(LTE)
			BUILTIN_PROCEDURE_DECLARATION(Quotient)
			BUILTIN_PROCEDURE_DECLARATION(Remainder)
			BUILTIN_PROCEDURE_DECLARATION(Modulo)
			BUILTIN_PROCEDURE_DECLARATION(Floor)
			BUILTIN_PROCEDURE_DECLARATION(Ceiling)
			BUILTIN_PROCEDURE_DECLARATION(Truncate)
			BUILTIN_PROCEDURE_DECLARATION(Round)
			BUILTIN_PROCEDURE_DECLARATION(Sin)
			BUILTIN_PROCEDURE_DECLARATION(Cos)
			BUILTIN_PROCEDURE_DECLARATION(Tan)
			BUILTIN_PROCEDURE_DECLARATION(Asin)
			BUILTIN_PROCEDURE_DECLARATION(Acos)
			BUILTIN_PROCEDURE_DECLARATION(Atan)
			BUILTIN_PROCEDURE_DECLARATION(Sqrt)
			BUILTIN_PROCEDURE_DECLARATION(Expt)
			BUILTIN_PROCEDURE_DECLARATION(Log)
			BUILTIN_PROCEDURE_DECLARATION(Exp)
		} // namespace math
	} // namespace builtins

	template class sPointer<Expression>;
	template class sPointer<Pair>;
} // namespace whelk


