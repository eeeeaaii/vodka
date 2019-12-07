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
#include "expression.h"
#include "storage_allocator.h"
#include "port.h"
#include <vcclr.h>
#include <string>

// TODO: these classes are not finished at all

namespace whelk {

	class WindowsClientPort :
		public ClientPort
	{
	private:
		gcroot<System::Net::Sockets::Socket*> sock;
	public:
		WindowsClientPort(void);
		WindowsClientPort(string hostname, int port);
		virtual ~ClientPort(void);

		void writeChar(char c);
		char readChar();
		virtual sPointer<Expression> newobj() { return GSA.createExp(new WindowsClientPort()); }
		virtual sPointer<Expression> copystate(sPointer<Expression> n) { assert(false); }
		void close();
	};


	class WindowsServerPort :
		public ServerPort
	{
	private:
	//	gcroot<System::Net::Sockets::Socket*> sock;
	//	void connect();
	public:
		WindowsServerPort(void);
		WindowsServerPort(int port);
		virtual ~ServerPort(void);

		void writeChar(char c);
		char readChar();
		virtual sPointer<Expression> newobj() { return GSA.createExp(new WindowsServerPort()); }
		virtual sPointer<Expression> copystate(sPointer<Expression> n) { ((ServerPort*)n)->port = port; }
		void close();
	};

};

