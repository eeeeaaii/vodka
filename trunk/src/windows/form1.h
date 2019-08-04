#pragma once


namespace whelk
{
	class Event;
	class ThingHolder;
	class GraphicsContext;


	/// <summary> 
	/// Summary for Form1
	///
	/// WARNING: If you change the name of this class, you will need to change the 
	///          'Resource File Name' property for the managed resource compiler tool 
	///          associated with all .resx files this class depends on.  Otherwise,
	///          the designers will not be able to interact properly with localized
	///          resources associated with this form.
	/// </summary>
	public __gc class Form1 : public System::Windows::Forms::Form
	{	
	public:
		Form1(void)
		{
			InitializeComponent();
			saved = false;
		}
  
	protected:
		void Dispose(System::Boolean disposing)
		{
			if (disposing && components)
			{
				components->Dispose();
			}
			__super::Dispose(disposing);
		}
		private: System::Windows::Forms::MainMenu *  mainMenu1;
		private: System::Windows::Forms::MenuItem *  menuItem1;




	private:
		ThingHolder *th;
		GraphicsContext *gc;
		int shifton;
		int ctrlon;
		int alton;
		bool evaluating;
		bool saved;
		System::String *sfilename;
	private: System::Windows::Forms::MenuItem *  New;
	private: System::Windows::Forms::MenuItem *  Open;
	private: System::Windows::Forms::MenuItem *  Save;
	private: System::Windows::Forms::MenuItem *  SaveAs;
	private: System::Windows::Forms::MenuItem *  Exit;
	private: System::Windows::Forms::MenuItem *  menuItem7;

		void processEvent(Event *e);
		void processKey(unsigned int nChar);
		System::Void Initialize(System::Object *  sender, System::EventArgs *  e);
		System::Void SendKeyDownEvent(System::Object *  sender, System::Windows::Forms::KeyEventArgs *  e);
		System::Void SendKeyUpEvent(System::Object *  sender, System::Windows::Forms::KeyEventArgs *  e);
		System::Void SendMouseDownEvent(System::Object *  sender, System::Windows::Forms::MouseEventArgs *  e);
		System::Void DrawAll(System::Object *  sender, System::Windows::Forms::PaintEventArgs *  e);
		System::Void BeforeClosing(System::Object *  sender, System::ComponentModel::CancelEventArgs *  e);
		System::Void AfterClosing(System::Object *  sender, System::EventArgs *  e);
		System::Void New_Click(System::Object *  sender, System::EventArgs *  e);
		System::Void Open_Click(System::Object *  sender, System::EventArgs *  e);
		System::Void Save_Click(System::Object *  sender, System::EventArgs *  e);
		System::Void SaveAs_Click(System::Object *  sender, System::EventArgs *  e);
		System::Void Exit_Click(System::Object *  sender, System::EventArgs *  e);


		/// <summary>
		/// Required designer variable.
		/// </summary>
		System::ComponentModel::Container * components;

		/// <summary>
		/// Required method for Designer support - do not modify
		/// the contents of this method with the code editor.
		/// </summary>
		void InitializeComponent(void)
		{
			this->mainMenu1 = new System::Windows::Forms::MainMenu();
			this->menuItem1 = new System::Windows::Forms::MenuItem();
			this->New = new System::Windows::Forms::MenuItem();
			this->Open = new System::Windows::Forms::MenuItem();
			this->Save = new System::Windows::Forms::MenuItem();
			this->SaveAs = new System::Windows::Forms::MenuItem();
			this->menuItem7 = new System::Windows::Forms::MenuItem();
			this->Exit = new System::Windows::Forms::MenuItem();
			// 
			// mainMenu1
			// 
			System::Windows::Forms::MenuItem* __mcTemp__1[] = new System::Windows::Forms::MenuItem*[1];
			__mcTemp__1[0] = this->menuItem1;
			this->mainMenu1->MenuItems->AddRange(__mcTemp__1);
			// 
			// menuItem1
			// 
			this->menuItem1->Index = 0;
			System::Windows::Forms::MenuItem* __mcTemp__2[] = new System::Windows::Forms::MenuItem*[6];
			__mcTemp__2[0] = this->New;
			__mcTemp__2[1] = this->Open;
			__mcTemp__2[2] = this->Save;
			__mcTemp__2[3] = this->SaveAs;
			__mcTemp__2[4] = this->menuItem7;
			__mcTemp__2[5] = this->Exit;
			this->menuItem1->MenuItems->AddRange(__mcTemp__2);
			this->menuItem1->Text = S"File";
			// 
			// New
			// 
			this->New->Index = 0;
			this->New->Text = S"New";
			this->New->Click += new System::EventHandler(this, New_Click);
			// 
			// Open
			// 
			this->Open->Index = 1;
			this->Open->Text = S"Open";
			this->Open->Click += new System::EventHandler(this, Open_Click);
			// 
			// Save
			// 
			this->Save->Index = 2;
			this->Save->Text = S"Save";
			this->Save->Click += new System::EventHandler(this, Save_Click);
			// 
			// SaveAs
			// 
			this->SaveAs->Index = 3;
			this->SaveAs->Text = S"Save As";
			this->SaveAs->Click += new System::EventHandler(this, SaveAs_Click);
			// 
			// menuItem7
			// 
			this->menuItem7->Index = 4;
			this->menuItem7->Text = S"-";
			// 
			// Exit
			// 
			this->Exit->Index = 5;
			this->Exit->Text = S"Exit";
			this->Exit->Click += new System::EventHandler(this, Exit_Click);
			// 
			// Form1
			// 
			this->AutoScaleBaseSize = System::Drawing::Size(5, 13);
			this->ClientSize = System::Drawing::Size(464, 361);
			this->Menu = this->mainMenu1;
			this->Name = S"Form1";
			this->Text = S"Form1";
			this->KeyDown += new System::Windows::Forms::KeyEventHandler(this, SendKeyDownEvent);
			this->MouseDown += new System::Windows::Forms::MouseEventHandler(this, SendMouseDownEvent);
			this->Closing += new System::ComponentModel::CancelEventHandler(this, BeforeClosing);
			this->Load += new System::EventHandler(this, Initialize);
			this->KeyUp += new System::Windows::Forms::KeyEventHandler(this, SendKeyUpEvent);
			this->Closed += new System::EventHandler(this, AfterClosing);
			this->Paint += new System::Windows::Forms::PaintEventHandler(this, DrawAll);

		}	
};
}

