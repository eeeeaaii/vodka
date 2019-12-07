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
#include "storage_manager.h"
#include <assert.h>

using namespace std;

/*
Problem:
by forward-declaring Expression I break the template when it comes to Expressions.
but if I explicitly declare an operator for converting to Expression,
it doesn't link.
But I have to forward-declare because of the typedef sPointer<Expression> sPointer<Expression>

Fix:
get rid of all the forward declarations, they aren't allowed anyway.
*/

namespace whelk {

	template<class T>
	class sPointer {
	private:
		T *p;
		void performAssignment(T * const p2) {
			if (p != p2) {
				if (p != 0) {
					GSM.removeRef(p);
				}
				if (p2 != 0) {
					GSM.addRef(p2);
				}
				p = p2;
			}
		}

	public:
		sPointer(T *p_in = 0) : p(p_in) {}

		sPointer(const sPointer<T>& newp) {
			if (newp.getP()) {
				GSM.addRef(newp.getP());
			}
			p = newp.getP();
		}

		~sPointer(void) {
			if (p) {
				GSM.removeRef(p);
			}
		}

		sPointer& operator=(const sPointer<T>& a) {
			performAssignment(a.getP());
			return *this;
		}

		T& operator*() {
			return *p;
		}

		T* operator->() {
			return p;
		}

		T *getP() const {
			return p;
		}

		bool operator!() {
			return !p;
		}

		bool operator==(const sPointer<T>& rhs) {
			return (p->getID() == rhs.p->getID());
		}

		bool operator!=(const sPointer<T>& rhs) {
			return (p->getID() != rhs.p->getID());
		}

		template <class U> operator U*() {
			U* r;
			r = dynamic_cast<U*>(p);
			if (!r) {
				assert(false);
			}
			return r;
		}
	};
};
