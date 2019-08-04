

#include "whelk.h"
//#include "rrccmm.h"
#include "eval_exception.h"
#include "storage_manager.h"
#include "environment.h"
#include "expression.h"
#include "event_handler.h"
#include "bitmap.h"
#include "whelk_string.h"
#include "integer.h"
#include "pair.h"
#include "real.h"
#include "boolean.h"
#include "number.h"
#include "for_debugging.h"

#include <math.h>
#include "procedure.h"
#include <iostream>
#include <fstream>

using namespace std;
using namespace builtins;
using namespace builtins::math;

//=============================================

void Add::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER|XT_MULTIPLE);
//	prototype.push_back(XT_NUMBER);
}

sPtr Add::apply()
{
	int t = argPromote();
	switch(t) {
		case XT_INTEGER: {
			int sum = 0;
			for (int i = 0 ; i < numArgs() ; i++) {
				sum += ((Integer*)arg(i))->getIntRep();
			}
			return GSM.newInteger(sum);
		}
		case XT_REAL: {
			double sum = 0;
			for (int i = 0 ; i < numArgs() ; i++) {
				sum += ((Real*)arg(i))->getRealRep();
			}
			return GSM.newReal(sum);
		}
	}
}

//=============================================

void Subtract::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER|XT_MULTIPLE);
}

sPtr Subtract::apply()
{
	int t = argPromote();
	switch(t) {
		case XT_INTEGER: {
			int r;
			if (numArgs() == 1) {
				r = -((Integer*)arg(0))->getIntRep();
			} else {
				r = ((Integer*)arg(0))->getIntRep();
				for (int i = 1 ; i < numArgs() ; i++) {
					r -= ((Integer*)arg(i))->getIntRep();
				}
			}
			return GSM.newInteger(r);
		}
		case XT_REAL: {
			double r;
			if (numArgs() == 1) {
				r = -((Real*)arg(0))->getRealRep();
			} else {
				r = ((Real*)arg(0))->getRealRep();
				for (int i = 1 ; i < numArgs() ; i++) {
					r -= ((Real*)arg(i))->getRealRep();
				}
			}
			return GSM.newReal(r);
		}
	}
}

//=============================================

void Multiply::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER|XT_MULTIPLE);
//	prototype.push_back(XT_NUMBER);
}

sPtr Multiply::apply()
{
	int t = argPromote();
	switch(t) {
		case XT_INTEGER: {
			int r = 1;
			for (int i = 0 ; i < numArgs() ; i++) {
				r *= ((Integer*)arg(i))->getIntRep();
			}
			return GSM.newInteger(r);
		}
		case XT_REAL: {
			double r = 1;
			for (int i = 0 ; i < numArgs() ; i++) {
				r *= ((Real*)arg(i))->getRealRep();
			}
			return GSM.newReal(r);
		}
	}
}

//=============================================


void Divide::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER|XT_MULTIPLE);
}

sPtr Divide::apply()
{
	int t = argPromote();
	switch(t) {
		case XT_INTEGER:
		{
			int r;
			double d;
			bool usedouble;
			usedouble = false;
			if (numArgs() == 1) {
				int tmp = ((Integer*)arg(0))->getIntRep();
				if (tmp == 0) {
					throw new EvalException("divide by zero error.");
				} else if (abs(tmp) == 1) {
					return GSM.newInteger(tmp);
				} else {
					d = 1.0 / (double)((Integer*)arg(0))->getIntRep();
					usedouble = true;
				}
			} else {
				r = ((Integer*)arg(0))->getIntRep();
				d = (double)r;
				for (int i = 1 ; i < numArgs() ; i++) {
					int tmp = ((Integer*)arg(i))->getIntRep();
					if (tmp == 0) {
						throw new EvalException("divide by zero error.");
					}
					if (usedouble || r % tmp != 0) {
						usedouble = true;
						d = d / (double)tmp;
					} else {
						r /= tmp;
					}
				}
			}
			if (usedouble) {
				return GSM.newReal(d);
			} else {
				return GSM.newInteger(r);
			}
		}
		case XT_REAL:
		{
			double d;
			if (numArgs() == 1) {
				double tmp = ((Real*)arg(0))->getRealRep();
				if (tmp == 0) {
					throw new EvalException("divide by zero error.");
				} else {
					d = 1.0 / ((Real*)arg(0))->getRealRep();
				}
			} else {
				d = ((Real*)arg(0))->getRealRep();
				for (int i = 1 ; i < numArgs() ; i++) {
					double tmp = ((Real*)arg(i))->getRealRep();
					if (tmp == 0) {
						throw new EvalException("divide by zero error.");
					}
					d = d / tmp;
				}
			}
			return GSM.newReal(d);
		}
	}
}

//=============================================

void E::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
	prototype.push_back(XT_NUMBER);
}
sPtr E::apply()
{
	int t = argPromote();
	switch(t) {
		case XT_INTEGER:
		return GSM.newBoolean(
			((Integer*)arg(0))->getIntRep()
			==
			((Integer*)arg(1))->getIntRep()
			);
		case XT_REAL:
		return GSM.newBoolean(
			((Real*)arg(0))->getRealRep()
			==
			((Real*)arg(1))->getRealRep()
			);
	}
}
//=============================================

void GT::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
	prototype.push_back(XT_NUMBER);
}

sPtr GT::apply()
{
	int t = argPromote();
	switch(t) {
		case XT_INTEGER:
		return GSM.newBoolean(
			((Integer*)arg(0))->getIntRep()
			>
			((Integer*)arg(1))->getIntRep()
			);
		case XT_REAL:
		return GSM.newBoolean(
			((Real*)arg(0))->getRealRep()
			>
			((Real*)arg(1))->getRealRep()
			);
	}
}

//=============================================

void GTE::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
	prototype.push_back(XT_NUMBER);
}

sPtr GTE::apply()
{
	int t = argPromote();
	switch(t) {
		case XT_INTEGER:
		return GSM.newBoolean(
			((Integer*)arg(0))->getIntRep()
			>=
			((Integer*)arg(1))->getIntRep()
			);
		case XT_REAL:
		return GSM.newBoolean(
			((Real*)arg(0))->getRealRep()
			>=
			((Real*)arg(1))->getRealRep()
			);
	}
}


//=============================================

void LT::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
	prototype.push_back(XT_NUMBER);
}

sPtr LT::apply()
{
	int t = argPromote();
	switch(t) {
		case XT_INTEGER:
		return GSM.newBoolean(
			((Integer*)arg(0))->getIntRep()
			<
			((Integer*)arg(1))->getIntRep()
			);
		case XT_REAL:
		return GSM.newBoolean(
			((Real*)arg(0))->getRealRep()
			<
			((Real*)arg(1))->getRealRep()
			);
	}
}


//=============================================

void LTE::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
	prototype.push_back(XT_NUMBER);
}
sPtr LTE::apply()
{
	int t = argPromote();
	switch(t) {
		case XT_INTEGER:
		return GSM.newBoolean(
			((Integer*)arg(0))->getIntRep()
			<=
			((Integer*)arg(1))->getIntRep()
			);
		case XT_REAL:
		return GSM.newBoolean(
			((Real*)arg(0))->getRealRep()
			<=
			((Real*)arg(1))->getRealRep()
			);
	}
}





//=============================================

void Sin::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Sin::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	d = sin(d);
	return GSM.newReal(d);
}

//=============================================

void Cos::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Cos::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	d = cos(d);
	return GSM.newReal(d);
}

//=============================================

void Tan::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Tan::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	d = tan(d);
	return GSM.newReal(d);
}


//=============================================

void Asin::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Asin::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	d = asin(d);
	return GSM.newReal(d);
}

//=============================================

void Acos::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Acos::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	d = acos(d);
	return GSM.newReal(d);
}

//=============================================

void Atan::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Atan::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	d = atan(d);
	return GSM.newReal(d);
}

//=============================================

void Sqrt::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Sqrt::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	if (d < 0) {
		throw new EvalException("imaginary numbers not yet implemented: sqrt of negative number illegal.");
	}
	d = sqrt(d);
	return GSM.newReal(d);
}

//=============================================

void Expt::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
	// assert(change this)
	prototype.push_back(XT_INTEGER);
}

sPtr Expt::apply()
{
	sPtr n0 = arg(0);
	sPtr n1 = arg(1);
	n0 = promoteToLevel(n0, XT_REAL);
	n1 = promoteToLevel(n1, XT_REAL);
	double d0 = ((Real*)n0)->getRealRep();
	double d1 = ((Real*)n1)->getRealRep();
	if (d0 == 0 && d1 < 0) {
		throw new EvalException("cannot take 0 to a negative power (divide by zero error)");
	}
	double r = pow(d0, d1);
	return GSM.newReal(r);
}
//=============================================

void Log::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Log::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	d = log(d);
	return GSM.newReal(d);
}
//=============================================

void Exp::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Exp::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	d = exp(d);
	return GSM.newReal(d);
}

//=============================================

void Modulo::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_INTEGER);
	prototype.push_back(XT_INTEGER);
}

sPtr Modulo::apply()
{
	// note the if a = b mod c, then
	// that means that a - b is divisible by c.
	// that's why modding by negative numbers
	// does weird things.  Hopefully the c++
	// mod operator does the right thing.
	if (((Integer*)arg(1))->getIntRep() == 0) {
		throw new EvalException("divide by zero error.");
	}
	// do not promote
	return GSM.newInteger(
			((Integer*)arg(0))->getIntRep()
			%
			((Integer*)arg(1))->getIntRep()
			);
}
//=============================================

void Quotient::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_INTEGER);
	prototype.push_back(XT_INTEGER);
}

sPtr Quotient::apply()
{
	if (((Integer*)arg(1))->getIntRep() == 0) {
		throw new EvalException("divide by zero error.");
	}
	// do not promote
	int r = ((Integer*)arg(0))->getIntRep()
			/
			((Integer*)arg(1))->getIntRep()
			;
	return GSM.newInteger(r);
}
//=============================================

void Remainder::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_INTEGER);
	prototype.push_back(XT_INTEGER);
}

sPtr Remainder::apply()
{
	if (((Integer*)arg(1))->getIntRep() == 0) {
		throw new EvalException("divide by zero error.");
	}
	// do not promote
	int dividend = ((Integer*)arg(0))->getIntRep();
	int divisor = abs(((Integer*)arg(1))->getIntRep());
	int sign = (dividend >= 0) ? 1 : -1;
	dividend = abs(dividend);
	int result;
	for ( result = dividend ; abs(result) > divisor ; result -= divisor );
	return GSM.newInteger(result * sign);
}

//=============================================

void Floor::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Floor::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	d = floor(d);
	return GSM.newReal(d);
}

//=============================================

void Ceiling::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Ceiling::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	d = ceil(d);
	return GSM.newReal(d);
}
//=============================================

void Truncate::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Truncate::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	if (d < 0) {
		d = ceil(d);
	} else {
		d = floor(d);
	}
	return GSM.newReal(d);
}
//=============================================

void Round::getPrototype(vector<int>& prototype)
{
	prototype.push_back(XT_NUMBER);
}

sPtr Round::apply()
{
	sPtr n = arg(0);
	n = promoteToLevel(n, XT_REAL);
	double d = ((Real*)n)->getRealRep();
	double r;
	if (d > 0) {
		double d2 = floor(d);
		double d3 = d - d2;
		if (d3 < .5) r = d2;
		else r = d2 + 1;
	} else {
		double d2 = ceil(d);
		double d3 = d2 - d;
		if (d3 > -.5) r = d2;
		else r = d2 - 1;
	}
	return GSM.newReal(r);
}
