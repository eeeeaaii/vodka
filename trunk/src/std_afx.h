// stdafx.h : include file for standard system include files,
// or project specific include files that are used frequently, but
// are changed infrequently
#pragma once

#pragma warning (disable:4661 4800)


#define WIN32_LEAN_AND_MEAN		// Exclude rarely-used stuff from Windows headers
// C RunTime Header Files
#include <stdlib.h>
#include <stdio.h>
#include <malloc.h>
#include <memory.h>
#include <tchar.h>
#include <assert.h>
#include <vector>
#include <string>
#include <list>
#include <map>

namespace whelk {
	int CARINVERSION_ = 1;
}

using namespace std;
using namespace whelk;

#define WHELK_IDE
//#define WHELK_VM


// TODO: reference additional headers your program requires here
