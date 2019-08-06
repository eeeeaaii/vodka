#pragma once
#include "expression.h"
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
		virtual sPtr newobj() { return GSM.createExp(new WindowsClientPort()); }
		virtual sPtr copystate(sPtr n) { assert(false); }
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
		virtual sPtr newobj() { return GSM.createExp(new WindowsServerPort()); }
		virtual sPtr copystate(sPtr n) { ((ServerPort*)n)->port = port; }
		void close();
	};

};

