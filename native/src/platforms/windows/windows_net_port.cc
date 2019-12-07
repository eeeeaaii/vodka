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


#include "port.h"
#include "net_port.h"
#include <iostream>
#include <fstream>
#include "fordebugging.h"
#using <mscorlib.dll>


WindowsClientPort::WindowsClientPort(void) : ClientPort()
{
	assert(false);
}

WindowsClientPort::WindowsClientPort(string hostname, int port) : ClientPort(hostname, port)
{
	assert(false);
}


void WindowsClientPort::connect()
{
	gcroot<System::String*> h = new System::String(hostname.c_str());
	gcroot<System::Net::IPHostEntry*> hostEntry = System::Net::Dns::Resolve(h);
	int n = hostEntry->AddressList->Length;
	if (n < 1) {
		assert(false);
	}
	gcroot<System::Net::IPAddress*> address = __try_cast<System::Net::IPAddress*>(hostEntry->AddressList->Item[0]);
	gcroot<System::Net::IPEndPoint*> endPoint = new System::Net::IPEndPoint(address, port);
	sock = new System::Net::Sockets::Socket(endPoint->AddressFamily, System::Net::Sockets::SocketType::Stream, System::Net::Sockets::ProtocolType::Tcp);
    sock->Connect(endPoint);
	if (sock->Connected) {
		open = true;
	} else {
		assert(false);
    }
}

void WindowsClientPort::writeChar(char c)
{
	if (!open) connect();
//	gcroot<*Byte> msg= Encoding::ASCII->GetBytes(c);
	gcroot<System::Byte[]> msg = new System::Byte[1];
	msg[0] = c;
    try 
    {
        // Blocks until send returns.
        int i = sock->Send(msg, 0, 1, System::Net::Sockets::SocketFlags::None);
    }
    catch (gcroot<System::Net::Sockets::SocketException*> e)
    {
		assert(false);
    }
}

char WindowsClientPort::readChar()
{
	if (!open) connect();
	return 'x';
}

//--------------------------------------------//


WindowsServerPort::WindowsServerPort(void) : ServerPort()
{
	assert(false);
}

WindowsServerPort::WindowsServerPort(int port) : ServerPort(port)
{
	assert(false);
}

WindowsServerPort::~WindowsServerPort(void)
{
}
