#pragma once
#pragma warning (disable:4661 4800)

#include <stdlib.h>
#include <stdio.h>
#include <malloc.h>
#include <math.h>
#include <memory.h>
#include <tchar.h>
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

namespace carin {
	const int CARINVERSION = 1;
}

using namespace std;
using namespace carin;

#define RCMTRACE

#define RCM_IDE
//

#define PAIR(X) ((Pair*)X)

//#define RCM_VM

