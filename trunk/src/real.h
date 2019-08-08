#pragma once

#include "number.h"

namespace whelk {
	class Real :
		public Number
	{
	private:
		double value;
	public:
		Real();
		Real(double v);
		Real(int n);
		Real(const string numstr);
		~Real();
		void setValue(double d);
		bool checkValid(string s);
		virtual double getRealRep();
		virtual sPointer<Expression> promote();
		virtual sPointer<Expression> newobj();
		virtual sPointer<Expression> copystate(sPointer<Expression> n);
	};
}

