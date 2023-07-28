import { BackgroundPiece } from './backgroundPiece.js';
import { Vec } from './vec.js';

// Editor to make setting up maps easier
// Also to test stuff out

interface ImageInfo {
	src: string;
	w: number;
	h: number;
	// For editing's sake
	name?: string;
}
const imgList: ImageInfo[] = [
	{
		name: 'Grass',
		src: 'background.png',
		w: 1000,
		h: 560,
	},
];
const imgToPcMap = new Map<HTMLImageElement, BackgroundPiece>();
const pcToImgMap = new Map<BackgroundPiece, HTMLImageElement>();

// Representing scale by larger integers to avoid decimal errors
const fullScale = 50;
const view = {
	scale: fullScale,
	pos: {
		x: 0,
		y: 0,
	},
};

const mouse = {
	isDown: false,
	x: 0,
	y: 0,
};

let pieceToAdd: BackgroundPiece | undefined;

const worldContainer = document.querySelector('.world') as HTMLDivElement;
const mapContainer = worldContainer.querySelector('.map') as HTMLDivElement;
const pieceHolderEl = worldContainer.querySelector(
	'.piece-holder',
) as HTMLDivElement;
const uiContainer = document.querySelector('.ui') as HTMLDivElement;

const imgBtnList = uiContainer.querySelector(
	'.img-selection',
) as HTMLDivElement;
imgList.forEach((info) => {
	const btn = document.createElement('button');
	btn.textContent = info.name ?? info.src;
	btn.addEventListener('click', () => {
		const piece: BackgroundPiece = {
			x: 0,
			y: 0,
			w: info.w,
			h: info.h,
			src: info.src,
			bridges: [],
		};

		const img = document.createElement('img');
		img.src = `assets/${info.src}`;
		img.width = info.w;
		img.height = info.h;
		img.style.translate = `${mouse.x - info.w / 2}px ${mouse.y - info.h / 2}px`;
		// img.style.translate = `${mouse.x}px ${mouse.y}px`;
		img.style.scale = String(view.scale / fullScale);

		pcToImgMap.set(piece, img);
		imgToPcMap.set(img, piece);

		pieceToAdd = piece;
		pieceHolderEl.replaceChildren(img);
		btn.blur();
	});
	imgBtnList.appendChild(btn);
});

document.addEventListener('mousemove', (e) => {
	// console.log(
	// 	Math.round(e.x - innerWidth / 2),
	// 	Math.round(e.y - innerHeight / 2),
	// );

	if (mouse.isDown) {
		view.pos = Vec.add(view.pos, Vec.sub(e, mouse));
		mapContainer.style.translate = `${view.pos.x}px ${view.pos.y}px`;
		console.log(view.pos.x, view.pos.y);
	}
	mouse.x = e.x;
	mouse.y = e.y;
	// projectedMousePosition();

	if (!pieceToAdd) return;

	// Centre img on mouse
	const img = pcToImgMap.get(pieceToAdd)!;
	img.style.translate = `${e.x - pieceToAdd.w / 2}px ${
		e.y - pieceToAdd.h / 2
	}px`;
	// img.style.translate = `${e.x}px ${e.y}px`;
});

// Get position when mouse hasn't move/page just loaded
// Apparently has been patched out? seems to work for me (firefox 103.0)
document.addEventListener('mouseover', (e) => {
	mouse.x = e.x;
	mouse.y = e.y;
	// projectedMousePosition();
});

document.addEventListener('mousedown', () => (mouse.isDown = true));
document.addEventListener('mouseup', () => (mouse.isDown = false));

document.addEventListener('wheel', (e) => {
	if (Math.abs(e.deltaY) > 1) {
		// Don't change scale when it goes beyond limits
		const newScale = view.scale + -Math.sign(e.deltaY);
		if (newScale < fullScale * 0.1 || newScale > fullScale * 2) return;

		// Move towards mouse
		const ratio = 1 - newScale / view.scale;
		view.pos.x += (mouse.x - view.pos.x) * ratio;
		view.pos.y += (mouse.y - view.pos.y) * ratio;
		mapContainer.style.translate = `${view.pos.x}px ${view.pos.y}px`;

		// Update scale
		view.scale = newScale;
		mapContainer.style.scale = String(view.scale / fullScale);
		if (pieceToAdd) {
			const img = pcToImgMap.get(pieceToAdd)!;
			img.style.scale = String(view.scale / fullScale);
		}

		// projectedMousePosition();
	}
});

document.addEventListener('keydown', (e) => {
	if (e.key !== ' ' || !pieceToAdd) return;

	// Check if it collides with any existing piece first

	// Add piece to map
	const scale = view.scale / fullScale;
	// View position must be subtracted instead of added because of the way the Camera works
	// In short, adding to x/y moves the Camera up/left instead of down/right, respectively
	pieceToAdd.x = (mouse.x - view.pos.x - (pieceToAdd.w / 2) * scale) / scale;
	pieceToAdd.y = (mouse.y - view.pos.y - (pieceToAdd.h / 2) * scale) / scale;
	console.log(mouse.x, view.pos.x, pieceToAdd.x);

	const img = pcToImgMap.get(pieceToAdd)!;
	img.style.translate = `${pieceToAdd.x}px ${pieceToAdd.y}px`;
	img.style.removeProperty('scale');
	mapContainer.appendChild(img);

	// console.log(pieceToAdd.x, pieceToAdd.y, scale);

	pieceToAdd = undefined;
});

// function projectedMousePosition() {
// 	const scale = view.scale / fullScale;
// 	const x = (mouse.x - view.pos.x - 5 * scale) / scale;
// 	const y = (mouse.y - view.pos.y - 5 * scale) / scale;
// 	mousePos.style.translate = `${x}px ${y}px`;
// }
// const mousePos = document.createElement('div');
// const mapCentre = document.createElement('div');
// const screenCentre = document.createElement('div');
// screenCentre.style.cssText =
// 	mapCentre.style.cssText =
// 	mousePos.style.cssText =
// 		`
// 	position: absolute;
// 	width: 10px;
// 	height: 10px;
// 	background: red;
// 	z-index: 99999;
// 	pointer-events: none;
// `;
// mapCentre.style.background = 'blue';
// screenCentre.style.background = 'green';
// screenCentre.style.translate = mapCentre.style.translate = `${
// 	innerWidth / 2 - 5
// }px ${innerHeight / 2 - 5}px`;
// mapContainer.append(mousePos, mapCentre);
// worldContainer.append(screenCentre);
