#pragma once

namespace carin {
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
