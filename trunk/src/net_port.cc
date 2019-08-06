#include "whelk.h"
#include "port.h"
#include "net_port.h"
#include <iostream>
#include <fstream>
#include "for_debugging.h"


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
