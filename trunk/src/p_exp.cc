#include "whelk.h"
#include "p_exp.h"
#include "storage_manager.h"
#include "expression.h"
#include "integer.h"
#include "real.h"
#include "number.h"
#include "procedure.h"
#include "boolean.h"
#include "whelk_string.h"
#include "pair.h"
#include "image.h"
#include "whelk_string.h"
//#include "port.h"
//#include "net_port.h"
#include "char.h"

template sPointer<Expression>::operator Pair*();
template sPointer<Expression>::operator Char*();
//template sPointer<Expression>::operator ClientPort*();
//template sPointer<Expression>::operator InputPort*();
//template sPointer<Expression>::operator OutputPort*();
template sPointer<Expression>::operator Number*();
template sPointer<Expression>::operator Procedure*();
//template sPointer<Expression>::operator Port*();
template sPointer<Expression>::operator Boolean*();
template sPointer<Expression>::operator Image*();
template sPointer<Expression>::operator Integer*();
template sPointer<Expression>::operator Real*();
template sPointer<Pair>::operator Pair*();

template<class T>
sPointer<T>::sPointer(T *p_in) : p(p_in)
{
}

template<class T>
sPointer<T>::sPointer(const sPointer& newp)
{
	if (newp.getP()) {
		GSM.addRef(newp.getP());
	}
	p = newp.getP();
}

template<class T>
sPointer<T>::~sPointer(void)
{
	if (p) {
		GSM.removeRef(p);
	}
}

template<class T>
sPointer<T>& sPointer<T>::operator=(const sPointer<T>& a)
{
	performAssignment(a.getP());
	return *this;
}


template<class T>
void sPointer<T>::performAssignment(T *p2) {
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

template<class T>
T& sPointer<T>::operator*()
{
	return *p;
}

template<class T>
T* sPointer<T>::operator->()
{
	return p;
}

template<class T>
T* sPointer<T>::getP() const
{
	return p;
}

template<class T>
bool sPointer<T>::operator!()
{
	return !p;
}

template<class T>
sPointer<T>::operator Expression*()
{
	//whatever
	return (Expression*)p;
}

template<class T>
template<class U>
sPointer<T>::operator U*()
{
	U* r;
	r = dynamic_cast<U*>(p);
	if (!r) {
		assert(false);
	}
	return r;
}

template<class T>
bool sPointer<T>::operator==(const sPointer<T>& rhs)
{
	return (p->getID() == rhs.p->getID());
}

template<class T>
bool sPointer<T>::operator!=(const sPointer<T>& rhs)
{
	return (p->getID() != rhs.p->getID());
}

