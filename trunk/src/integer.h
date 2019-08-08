#pragma once
#include "number.h"

namespace whelk {

	class Integer :
		public Number
	{
	private:
		int value;
	public:
		Integer();
		Integer(int n);
		Integer(string numstr);
		virtual ~Integer();
		virtual sPointer<Expression> promote();
		virtual int getIntRep();
		virtual sPointer<Expression> newobj();
		virtual sPointer<Expression> copystate(sPointer<Expression> n);
	};
}


