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

