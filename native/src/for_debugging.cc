// Copyright 2003-2005, 2008, Jason Scherer
// Copyright 2019 Google, Inc.
/*
This file is part of Vodka.

Vodka is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vodka is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
*/


#include "for_debugging.h"
#ifdef WINDOWS
// following #using directive necessary to use .Net classes
#using <mscorlib.dll>
#endif
#include <string>
#include <sstream>

using namespace whelk;
using namespace std;

ForDebugging::ForDebugging(void)
{
}

ForDebugging::~ForDebugging(void)
{
}

void ForDebugging::trace(string str) const
{
#ifdef WHELK_TRACE
#ifdef WINDOWS
	gcroot<System::Diagnostics::Trace*> trace;
	gcroot<System::String*> trstr;

	trstr = new System::String(str.c_str());
	trace->Write(trstr);
#endif
#endif
}

void ForDebugging::trace(int i) const
{
	ostringstream os;
	os << i;
	trace(os.str());
}

void ForDebugging::traceln(string str) const
{
	trace(str + "\n");
}

