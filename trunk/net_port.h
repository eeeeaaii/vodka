#pragma once
#include "Expression.h"
#include "Port.h"
#include <vcclr.h>
#include <string>

namespace carin {

	class ClientPort :
		public Port
	{
	private:
		string hostname;
		int port;
		gcroot<System::Net::Sockets::Socket*> sock;
		void connect();
	public:
		ClientPort(void);
		ClientPort(string hostname, int port);
		void writeChar(char c);
		char readChar();
		virtual ~ClientPort(void);
		virtual sPtr newobj() { return GSM.createExp(new ClientPort()); }
		virtual sPtr copystate(sPtr n) { assert(false); }
		void close();
	};


	class ServerPort :
		public Port
	{
	private:
		int port;
	//	gcroot<System::Net::Sockets::Socket*> sock;
	//	void connect();
	public:
		ServerPort(void);
		ServerPort(int port);
		void writeChar(char c);
		char readChar();
		virtual ~ServerPort(void);
		virtual sPtr newobj() { return GSM.createExp(new ServerPort()); }
		virtual sPtr copystate(sPtr n) { ((ServerPort*)n)->port = port; }
		void close();
	};

};

