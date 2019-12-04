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

