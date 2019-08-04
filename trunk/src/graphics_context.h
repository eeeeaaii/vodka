#pragma once
#include "simple_defines.h"

namespace whelk {
  class Bitmap;

  class GraphicsContext  
  {
  private:
    stack<whelk::Point> originstack;
  public:
    GraphicsContext();
    virtual ~GraphicsContext();

    virtual void pushOrigin(whelk::Point neworigin) = 0;
    virtual whelk::Point popOrigin() = 0;

    virtual void drawBitmap(whelk::Bitmap *b, int x, int y, bool selected) = 0;
    virtual void drawSelectedRect(int x, int y, int w, int h) = 0;
    virtual void drawUnselectedRect(int x, int y, int w, int h, Direction type) = 0;
    virtual void drawText(string text, int x, int y, int selected) = 0;
    virtual int getTextWidth(string text) = 0;
    virtual int getTextHeight(string text) = 0;
  };
};