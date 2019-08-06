#pragma once

#include "simple_defines.h"

namespace whelk {
	class Expression;
//	class Boolean;
//	class Char;

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


		operator Expression*() { return (Expression*)p; }

		template <class U> operator U*() {
			U* r;
			r = dynamic_cast<U*>(p);
			if (!r) {
				assert(false);
			}
			return r;
		}


//		operator Boolean*() { return (Boolean*)p; }
//		operator Boolean*() { return (Boolean*)p; }


	};

	typedef sPointer<Expression> sPtr;
};


