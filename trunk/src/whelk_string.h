#pragma once
#include "expression.h"
#include <string>

namespace whelk {
	class String :
		public Expression
	{
	private:
		string value;
		string decode(string in);
		string encode(string in);
	public:
		String(void);
		String(string s, bool dec);
		~String(void);
		int getLength();
		string getStringRep();
		void setStringRep(string x, bool dec);
		virtual sPointer<Expression> newobj();
		virtual sPointer<Expression> copystate(sPointer<Expression> n) {
			((String*)n)->value = value;
			return Expression::copystate(n);
		}
	};

}

