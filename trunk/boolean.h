#pragma once
#include "expression.h"

namespace carin {
	class Boolean :
		public Expression
	{
	private:
		bool value;
		void setValue(bool b);

	public:
		Boolean(void);
		Boolean(bool b);
		Boolean(string c);
		virtual ~Boolean(void);

		virtual bool getBoolRep();
		virtual void setBoolRep(bool b);
		virtual sPtr newobj();
		virtual sPtr copystate(sPtr n);
	};
}
