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
		virtual sPtr promote();
		virtual int getIntRep();
		virtual sPtr newobj();
		virtual sPtr copystate(sPtr n);
	};
}


