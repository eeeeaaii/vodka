
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

