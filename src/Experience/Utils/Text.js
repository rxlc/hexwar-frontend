import { Text } from 'troika-three-text'

const createText = (text, fontSize, color) => {
    let newText = new Text();

    newText = new Text();
    newText.text = text
    newText.fontSize = fontSize;
    newText.color = color
    newText.anchorX = "center"
    
    return newText;
}

export default createText;