// Copyright 2003-2005, 2008, 2019 Jason Scherer
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
#include "code.h"

const int HEAPSIZE = 20000;

namespace whelk {
	class StorageManager  
	{
	public:
		StorageManager();
		virtual ~StorageManager();
		
		int allreferences[HEAPSIZE];

		void addRef(Code *t); // does not use sPointer<Expression>
		void removeRef(Code *t); // does not use sPointer<Expression>

	private:
		void releaseRef(Code *t); // does not use sPointer<Expression>

	};
};

extern whelk::StorageManager GSM;
