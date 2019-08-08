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
