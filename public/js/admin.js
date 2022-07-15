// alert("Hola");

const options_buttons = document.querySelectorAll('.options-button');
const options_cards = [];

options_buttons.forEach((button) => {
	const parent = button.parentElement;
	const options_classes = parent.children[2].classList;
  button.onclick = () => {
  	options_classes.toggle('open');
  }
})