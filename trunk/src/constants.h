#pragma once

/*
 * Constants having to do with events
 *
 */

const int ET_UNASSIGNED = 0;
const int ET_KEYDOWN = 1;
const int ET_KEYUP = 2;
const int ET_MOUSEMOVE = 3;
const int ET_MOUSEDOWN = 4;
const int ET_MOUSEUP = 5;
const int ET_INIT = 6;
const int ET_CALLBACK = 7;
const int ET_MESSAGE = 8;
const int ET_TICK = 9;
const int ET_USER = 10;

const int KEY_DOWNARROW = 1000;
const int KEY_UPARROW = 1001;
const int KEY_LEFTARROW = 1002;
const int KEY_RIGHTARROW = 1003;
const int KEY_ENTER = 1004;
const int KEY_BACKSPACE = 1005;
const int KEY_SPACE = 1006;
const int KEY_DELETE = 1007;
const int KEY_PGUP = 1008;
const int KEY_PGDOWN = 1009;
const int KEY_SHIFT = 1010;
const int KEY_CTRL = 1011;
const int KEY_ALT = 1012;

const int MOUSE_UNASSIGNED = 0;
const int MOUSE_LEFTBUTTON = 1;
const int MOUSE_RIGHTBUTTON = 2;
const int MOUSE_MIDDLEBUTTON = 3;

/*
 * Constants having to do with Expression data types
 *
 * Constants represent "exclusive types".  According to
 * R5RS, no object can satisfy more than one of these.
 *
 * XT_ANYTHING is used in procedure parameters where
 * the type of the argument doesn't matter.
 *
 * XT_MULTIPLE is used to indicate a procedure or form where
 * the number of arguments is unlimited (variable),
 * i.e. lambda, let, etc.
 *
 * Note that numeric types have to be ordered in the order of the
 * "type tower" so that promotion to a higher type can take place.
 */


const int XT_UNKNOWN = 0x00000001;
const int XT_NULL = 0x00000002;
const int XT_BOOLEAN = 0x00000004;
const int XT_SYMBOL = 0x00000008;
const int XT_CHAR = 0x00000010;
const int XT_VECTOR = 0x00000020;
const int XT_PROCEDURE = 0x00000040;
const int XT_PAIR = 0x00000080;
const int XT_STRING = 0x00000100;
const int XT_PORT = 0x00000200;
const int XT_IMAGE = 0x00000400;
const int XT_INTEGER = 0x00000800;
const int XT_REAL = 0x00001000;
const int XT_INPUT_PORT = 0x00002000;
const int XT_OUTPUT_PORT = 0x00004000;
const int XT_CLIENT_PORT = 0x00008000;
const int XT_SERVER_PORT = 0x00010000;
const int XT_ANYTHING = 0x0FFFFFFF;
const int XT_MULTIPLE = 0x80000000;
const int XT_OPTIONAL = 0x40000000;
const int XT_SKIPEVAL = 0x20000000;

const int XT_NUMBER = (XT_INTEGER|XT_REAL);



enum Direction {
	HDIR = 1,
	VDIR = 2,
	ZDIR = 4
};

#define PAIR(X) ((Pair*)X)

