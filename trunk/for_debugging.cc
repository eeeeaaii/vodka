#include "carin.h"
#include ".\fordebugging.h"
// following #using directive necessary to use .Net classes
#using <mscorlib.dll>


ForDebugging::ForDebugging(void)
{
}

ForDebugging::~ForDebugging(void)
{
}

void ForDebugging::trace(string str) const
{
#ifdef RCMTRACE
	gcroot<System::Diagnostics::Trace*> trace;
	gcroot<System::String*> trstr;

	trstr = new System::String(str.c_str());
	trace->Write(trstr);
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

