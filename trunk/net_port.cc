#include "carin.h"
#include ".\port.h"
#include "netport.h"
#include <iostream>
#include <fstream>
#include "fordebugging.h"
#using <mscorlib.dll>


VIRTUAL_CONSTRUCTOR(ClientPort);



ClientPort::ClientPort(void)
{
	assert(false);
}

ClientPort::ClientPort(string hostname_, int port_)
{
	type = XT_CLIENT_PORT;
	mytext = "{client-port}";
	hostname = hostname_;
	port = port_;
	open = false;
}

void ClientPort::connect()
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

void ClientPort::writeChar(char c)
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

char ClientPort::readChar()
{
	if (!open) connect();
	return 'x';
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

VIRTUAL_CONSTRUCTOR(ServerPort);


ServerPort::ServerPort(void)
{
	assert(false);
}
ServerPort::ServerPort(int port_)
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
