

class WebFontManager {

	loadFont(name) {
		WebFont.load({
			google: {
				families: [name]
			}
		})
	}

}

const webFontManager = new WebFontManager();


export { webFontManager }