#include "whelk.h"
#include "eval_exception.h"

EvalException::EvalException(string _message)
{
	message = _message;
}

EvalException::~EvalException()
{
}

void EvalException::addToMessage(string s)
{
	message = message + s;
}

string EvalException::getMessage()
{
	return message;
}
