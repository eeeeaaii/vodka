#pragma once

#include "simple_defines.h"

namespace whelk {
	class Expression;

	template<class T>
	class sPointer {
	private:
		T *p;
		void performAssignment(T * const p);
	public:
		sPointer(T *p_in = 0);
		sPointer(const sPointer<T>& p);
		~sPointer(void);
		sPointer& operator=(const sPointer<T>& a);
		T& operator*();
		T* operator->();
		T *getP() const;
		bool operator!();
		bool operator==(const sPointer<T>& rhs);
		bool operator!=(const sPointer<T>& rhs);
		template <class U> operator U*();
		operator Expression*();
	};

	typedef sPointer<Expression> sPtr;
};


