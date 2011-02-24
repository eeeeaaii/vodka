#pragma once
#include <vcclr.h>
#include "SimpleDefines.h"

namespace carin {
	class Bitmap;

	class GraphicsContext  
	{
	private:
		stack<carin::Point> originstack;
		gcroot<System::Drawing::Pen*> blackpen;   // can use str as if it were String*
		gcroot<System::Drawing::Pen*> bluegreypen;
		gcroot<System::Drawing::Pen*> greengreypen;
		gcroot<System::Drawing::Pen*> redgreypen;
		gcroot<System::Drawing::FontFamily*> fontfamily;
		gcroot<System::Drawing::Font*> basefont;
		gcroot<System::Drawing::SolidBrush*> selectedtextfillbrush;
		gcroot<System::Drawing::SolidBrush*> unselectedtextfillbrush;
	public:
		gcroot<System::Drawing::Graphics*> graphics;   // can use str as if it were String*

		GraphicsContext();
		virtual ~GraphicsContext();

		void pushOrigin(carin::Point neworigin);
		carin::Point popOrigin();

		void drawBitmap(carin::Bitmap *b, int x, int y, bool selected);
		void drawSelectedRect(int x, int y, int w, int h);
		void drawUnselectedRect(int x, int y, int w, int h, Direction type);
		void drawText(string text, int x, int y, int selected);
		int getTextWidth(string text);
		int getTextHeight(string text);
	};
};

