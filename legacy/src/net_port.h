#pragma once
#include "p_exp.h"
#include "expression.h"
#include "port.h"
#include <string>

namespace whelk {

	class ClientPort :
		public Port
	{
	private:
		string hostname;
		int port;

		virtual void connect() = 0;
	public:
		ClientPort(void);
		ClientPort(string hostname, int port);
		virtual ~ClientPort(void);

		virtual void writeChar(char c) = 0;
		virtual char readChar() = 0;
		virtual sPointer<Expression> newobj() = 0;
		virtual sPointer<Expression> copystate(sPointer<Expression> n) = 0;
		void close();
	};


	class ServerPort :
		public Port
	{
	private:
		int port;
	public:
		ServerPort(void);
		ServerPort(int port);
		virtual ~ServerPort(void);

		virtual void writeChar(char c) = 0;
		virtual char readChar() = 0;
		virtual sPointer<Expression> newobj() = 0;
		virtual sPointer<Expression> copystate(sPointer<Expression> n) = 0;
		void close();
	};

};

