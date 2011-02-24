#include "Form1.h"
#include "Carin.h"
#include <windows.h>
#include <string>

#include "GraphicsContext.h"
#include "EvalException.h"
#include "Event.h"
#include "ThingHolder.h"


using namespace carin;
using namespace std;

	using namespace System;
	using namespace System::ComponentModel;
	using namespace System::Collections;
	using namespace System::Windows::Forms;
	using namespace System::Data;
	using namespace System::Drawing;


int APIENTRY _tWinMain(HINSTANCE hInstance,
                     HINSTANCE hPrevInstance,
                     LPTSTR    lpCmdLine,
                     int       nCmdShow)
{
	System::Threading::Thread::CurrentThread->ApartmentState = System::Threading::ApartmentState::STA;
	System::Windows::Forms::Form __pin *f = new Form1();
	Application::Run(f);
	return 0;
}

void Form1::processEvent(Event *ev)
{
	if (ev && ev->type) {
		try {
#ifdef RCM_MULTITHREADED
			void **args = new void*[2];
			args[0] = (void *)th;
			args[1] = (void *)ev;
			AfxBeginThread(eventThreadStartup, (void*)args);
#else
			evaluating = true;
			th->handleEvent(ev);
			evaluating = false;
			delete ev;
#endif
		} catch (EvalException *ev) {
			::MessageBox(0, ev->getMessage().c_str(), "Error", 0);
//			//TRACE("Eval exception thrown.\n");
//			//TRACE("%s\n", ev->message);
		}
	}
//	try {
//		th->dumpTree();
//	} catch (CException ce) {
//		//TRACE("MFC exception thrown.");
//	} catch (EvalException) {
//		//TRACE("Eval Exception thrown");
//	} catch (void) {
//		//TRACE("other Exception thrown");
//	}
}
void Form1::processKey(unsigned int nChar)
{
//	//TRACE("key: %c  int: %d  flags: %d\n", nChar, nChar, nFlags);
	//TRACE("key: %c  int: %d  flags: %d\n", nChar, nChar, nFlags);
	Event *ev = new Event();
	ev->type = ET_KEYDOWN;
	switch (nChar) {
//..MODIFIERS.....................................
	case 16:
		shifton = 1; // needed so we can set accurate char to the event, lc or uc
		ev->keyvalue = KEY_SHIFT;
		break;
	case 17:
		ctrlon = 1;
		ev->keyvalue = KEY_CTRL;
		break;
	case 18:
		alton = 1;
		ev->keyvalue = KEY_ALT;
		break;
//..DIRECTIONAL KEYS....................................
	case 34:
		ev->keyvalue = KEY_PGDOWN;
		break;
	case 33:
		ev->keyvalue = KEY_PGUP;
		break;
	case 37:
		ev->keyvalue = KEY_LEFTARROW;
		break;
	case 38:
		ev->keyvalue = KEY_UPARROW;
		break;
	case 39:
		ev->keyvalue = KEY_RIGHTARROW;
		break;
	case 8:
		ev->keyvalue = KEY_BACKSPACE;
		break;
	case 40:
		ev->keyvalue = KEY_DOWNARROW;
		break;
	case 46:
		ev->keyvalue = KEY_DELETE;
		break;
//..EVAL IN DEBUGGER..............................
	case 13:
		ev->keyvalue = KEY_ENTER;
		break;
//..FLIP DIRECTION OF CURRENT LIST................
	case ' ':
		ev->keyvalue = KEY_SPACE;
		break;
//..TYPING ATOM OF SOME KIND.....................
	default:
		// = + is 187
		// - _ is 189
		// / ? is 191 
		if (nChar >= 'A' && nChar <= 'Z') {
			ev->keyvalue = nChar + (shifton?0:'a'-'A');
		} else if (nChar >= '0' && nChar <= '9'  && !shifton) {
			ev->keyvalue = nChar;
		} else if (nChar == '1' && shifton) {
			ev->keyvalue = '!';
		} else if (nChar == '2' && shifton) {
			ev->keyvalue = '@';
		} else if (nChar == '3' && shifton) {
			ev->keyvalue = '#';
		} else if (nChar == '4' && shifton) {
			ev->keyvalue = '$';
		} else if (nChar == '5' && shifton) {
			ev->keyvalue = '%';
		} else if (nChar == '6' && shifton) {
			ev->keyvalue = '^';
		} else if (nChar == '7' && shifton) {
			ev->keyvalue = '&';
		} else if (nChar == '8' && shifton) {
			ev->keyvalue = '*';
		} else if (nChar == '9' && shifton) {
			ev->keyvalue = '(';
		} else if (nChar == '0' && shifton) {
			ev->keyvalue = ')';
		} else if (nChar == 186 && shifton) {
			ev->keyvalue = ':';
		} else if (nChar == 186 && !shifton) {
			ev->keyvalue = ';';
		} else if (nChar == 187 && shifton) {
			ev->keyvalue = '+';
		} else if (nChar == 187 && !shifton) {
			ev->keyvalue = '=';
		} else if (nChar == 188 && shifton) {
			ev->keyvalue = '<';
		} else if (nChar == 188 && !shifton) {
			ev->keyvalue = ',';
		} else if (nChar == 189 && !shifton) {
			ev->keyvalue = '-';
		} else if (nChar == 189 && shifton) {
			ev->keyvalue = '_';
		} else if (nChar == 190 && shifton) {
			ev->keyvalue = '>';
		} else if (nChar == 190 && !shifton) {
			ev->keyvalue = '.';
		} else if (nChar == 191 && !shifton) {
			ev->keyvalue = '/';
		} else if (nChar == 191 && shifton) {
			ev->keyvalue = '?';
		} else if (nChar == 220 && !shifton) {
			ev->keyvalue = '\\';
		} else if (nChar == 220 && shifton) {
			ev->keyvalue = '|';
		} else if (nChar == 222 && shifton) {
			ev->keyvalue = '"';
		} else if (nChar == 222 && !shifton) {
			ev->keyvalue = '\'';
		} else {
			assert(false);
			int x = nChar;
		}
		break;
	}
	ev->shiftDown = shifton;
	ev->ctrlDown = ctrlon;
	ev->altDown = alton;
	ev->initEventInfo();
	processEvent(ev);
	Invalidate();
	//Update();
	// when do you have to call Update();?
}

System::Void Form1::Initialize(System::Object *  sender, System::EventArgs *  e)
{
	th = new ThingHolder();
	gc = new GraphicsContext();
	th->init();
}

System::Void Form1::SendKeyDownEvent(System::Object *  sender, System::Windows::Forms::KeyEventArgs *  e)
{
	int kv = e->get_KeyValue();
	processKey(kv);
}

System::Void Form1::SendKeyUpEvent(System::Object *  sender, System::Windows::Forms::KeyEventArgs *  e)
{
	int nChar = e->get_KeyValue();
	if (nChar == 16) shifton = 0;
	if (nChar == 17) ctrlon = 0;
	if (nChar == 18) alton = 0;
}

System::Void Form1::SendMouseDownEvent(System::Object *  sender, System::Windows::Forms::MouseEventArgs *  e)
{
	if (e->get_Button() == MouseButtons::Left) {
		Event *ev = new Event();
		ev->type = ET_MOUSEDOWN;
		ev->button = MOUSE_LEFTBUTTON;
		ev->x = e->get_X();
		ev->y = e->get_Y();
		ev->initEventInfo();
		processEvent(ev);
		Invalidate();
	}
}

System::Void Form1::DrawAll(System::Object *  sender, System::Windows::Forms::PaintEventArgs *  e)
{
	gc->graphics = e->get_Graphics();
//	gc->graphics = e->Graphics();
//	gc->pDC = pDC;

#ifdef RCM_MULTITHREADED
	// whatever dude
#else
	// don't draw while evaluating
	System::Drawing::Color c;
	c = c.FromArgb(255, 255, 255);
	gc->graphics->Clear(c);
	if (!evaluating) {
		th->draw(gc);
	}
#endif
}

System::Void Form1::BeforeClosing(System::Object *  sender, System::ComponentModel::CancelEventArgs *  e)
{
	// this method should close down any running stuff within the Carin system
}

System::Void Form1::AfterClosing(System::Object *  sender, System::EventArgs *  e)
{
	// this method should dismantle the Carin system itself
	delete th;
	delete gc;
}


System::Void Form1::New_Click(System::Object *  sender, System::EventArgs *  e)
{
}

System::Void Form1::Open_Click(System::Object *  sender, System::EventArgs *  e)
{
     OpenFileDialog* openFileDialog1 = new OpenFileDialog();
 
     openFileDialog1->InitialDirectory = S"c:\\" ;
     openFileDialog1->Filter = S"txt files (*.txt)|*.txt|All files (*.*)|*.*" ;
     openFileDialog1->FilterIndex = 2 ;
     openFileDialog1->RestoreDirectory = true ;
 
     if(openFileDialog1->ShowDialog() == DialogResult::OK)
     {
		 System::String *fn = openFileDialog1->get_FileName();
		 System::Char c[] = fn->ToCharArray();
		 char ofilename[256];
		 for (int i = 0 ; i < min(256, fn->get_Length()) ; i++) {
			 ofilename[i] = c[i];
		 }
		 ofilename[i] = '\0';
		 th->load(ofilename);
		 Invalidate();
     }
}

System::Void Form1::Save_Click(System::Object *  sender, System::EventArgs *  e)
{
	if (saved) {
		 System::Char c[] = sfilename->ToCharArray();
		 char filename[256];
		 for (int i = 0 ; i < min(256, sfilename->get_Length()) ; i++) {
			 filename[i] = c[i];
		 }
		 filename[i] = '\0';
		 th->save(filename);
	} else {
		SaveAs_Click(sender, e);
	}
}

System::Void Form1::SaveAs_Click(System::Object *  sender, System::EventArgs *  e)
{
     SaveFileDialog* saveFileDialog1 = new SaveFileDialog();
 
     saveFileDialog1->Filter = S"txt files (*.txt)|*.txt|All files (*.*)|*.*"  ;
     saveFileDialog1->FilterIndex = 1 ;
     saveFileDialog1->RestoreDirectory = true ;
 
     if(saveFileDialog1->ShowDialog() == DialogResult::OK)
     {
		 sfilename = saveFileDialog1->get_FileName();
		 System::Char c[] = sfilename->ToCharArray();
		 char filename[256];
		 for (int i = 0 ; i < min(256, sfilename->get_Length()) ; i++) {
			 filename[i] = c[i];
		 }
		 filename[i] = '\0';
		 th->save(filename);
		 saved = true;
     }
}

System::Void Form1::Exit_Click(System::Object *  sender, System::EventArgs *  e)
{
}
