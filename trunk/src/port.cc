#include "port.h"
#include "for_debugging.h"
#include "storage_allocator.h"
#include <iostream>
#include <fstream>

using namespace whelk;
using namespace std;

Port::Port(void)
{
}

Port::~Port(void)
{
}

void Port::close()
{
	open = false;
}
//---------------------------------------------//

InputPort::InputPort(void)
{
}


InputPort::~InputPort(void)
{
}
//---------------------------------------------//

OutputPort::OutputPort(void)
{
}

OutputPort::~OutputPort(void)
{
}
//---------------------------------------------//

FileInputPort::FileInputPort(void) : InputPort()
{
	assert(false);
}

FileInputPort::FileInputPort(string filename) : InputPort()
{
	open = true;
	type = XT_INPUT_PORT;
	ifstream *ift = new ifstream;
	ift->open(filename.c_str());
	in = ift;
	in->unsetf(ios_base::skipws);
	mytext = "{file-input-port}";
}

FileInputPort::~FileInputPort(void)
{
	delete in;
}

char FileInputPort::readChar()
{
	if (!open) assert(false);
	char i;
	(*in) >> i;
	return i;
}

char FileInputPort::peekChar()
{
	if (!open) return false;
	char i = in->peek();
	return i;
}

bool FileInputPort::isEof()
{
	return in->eof();
}

sPointer<Expression> FileInputPort::newobj() {
	return GSA.createExp(new FileInputPort());
}



//---------------------------------------------//

FileOutputPort::FileOutputPort(void) : OutputPort()
{
}

FileOutputPort::FileOutputPort(string filename) : OutputPort()
{
	open = true;
	type = XT_OUTPUT_PORT;
	mytext = "{file-output-port}";
	ofstream *oft = new ofstream;
	oft->open(filename.c_str());
	out = oft;
}


void FileOutputPort::writeChar(char o)
{
	if (!open) assert(false);
	dbg.trace("stream good = ");
	dbg.trace((*out).good());
	dbg.trace("\n");
	dbg.trace("stream eof = ");
	dbg.trace((*out).eof());
	dbg.trace("\n");
	dbg.trace("stream bad = ");
	dbg.trace((*out).bad());
	dbg.trace("\n");
	dbg.trace("stream fail = ");
	dbg.trace((*out).fail());
	dbg.trace("\n");
	(*out) << o;
	dbg.trace("stream good = ");
	dbg.trace((*out).good());
	dbg.trace("\n");
	dbg.trace("stream eof = ");
	dbg.trace((*out).eof());
	dbg.trace("\n");
	dbg.trace("stream bad = ");
	dbg.trace((*out).bad());
	dbg.trace("\n");
	dbg.trace("stream fail = ");
	dbg.trace((*out).fail());
	dbg.trace("\n");
	(*out).flush();
}

FileOutputPort::~FileOutputPort(void)
{
	delete out;
}

sPointer<Expression> FileOutputPort::newobj() {
	return GSA.createExp(new FileOutputPort());
}


//VIRTUAL_CONSTRUCTOR(FileOutputPort);
