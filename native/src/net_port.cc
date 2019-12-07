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
#include "for_debugging.h"

#include <iostream>
#include <fstream>
#include <string>

using namespace whelk;
using namespace std;

ClientPort::ClientPort(void) : Port()
{
	assert(false);
}

ClientPort::ClientPort(string hostname_, int port_) : Port()
{
	type = XT_CLIENT_PORT;
	mytext = "{client-port}";
	hostname = hostname_;
	port = port_;
	open = false;
}


void ClientPort::close()
{
	open = false;
}

ClientPort::~ClientPort(void)
{
	close();
}

//--------------------------------------------//



ServerPort::ServerPort(void) : Port()
{
	assert(false);
}
ServerPort::ServerPort(int port_) : Port()
{
	type = XT_SERVER_PORT;
	mytext = "{server-port}";
	port = port_;
	open = false;
}
ServerPort::~ServerPort(void)
{
}
void ServerPort::close()
{
	open = false;
}
