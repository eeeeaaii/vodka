#pragma once

namespace whelk {
	class EvalException  
	{
	private:
		string message;
	public:
		EvalException(string message);
		void addToMessage(string s);
		virtual ~EvalException();
		string getMessage();
	};
}
