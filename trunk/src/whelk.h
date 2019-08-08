#pragma once
#pragma warning (disable:4661 4800)

#include <stdlib.h>
#include <stdio.h>


#ifdef WINDOWS

#include <malloc.h>
#include <tchar.h>

#else

#include <sys/malloc.h>
// mac equiv of tchar.h?

#endif

#include <math.h>
#include <memory.h>
#include <assert.h>
#include <string>
#include <vector>
#include <list>
#include <stack>
#include <map>
#include <sstream>
#include <iostream>
#include <fstream>

#include "constants.h"

namespace whelk {
	const int CARINVERSION = 1;
}

using namespace std;
using namespace whelk;

#define WHELK_TRACE

#define WHELK_IDE
//

#define PAIR(X) ((Pair*)X)

//#define WHELK_VM

