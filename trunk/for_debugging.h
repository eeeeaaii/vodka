#pragma once
#include <vcclr.h>
#include <string>

namespace carin {
	class ForDebugging
	{
	public:
		ForDebugging();
		~ForDebugging(void);
		void trace(string str) const;
		void trace(int x) const;
		void traceln(string str) const;
	};
};

const ForDebugging dbg;
