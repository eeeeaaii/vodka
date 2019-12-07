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

#pragma once
#include "simple_defines.h"
#include "bitmap.h"
#include "constants.h"
#include <stack>


using namespace std;

namespace whelk {
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