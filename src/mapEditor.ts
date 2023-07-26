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

const worldContainer = document.querySelector('.world') as HTMLDivElement;
const mapContainer = worldContainer.querySelector('.map') as HTMLDivElement;
const pieceHolderEl = worldContainer.querySelector(
	'.piece-holder',
) as HTMLDivElement;
const uiContainer = document.querySelector('.ui') as HTMLDivElement;

let pieceToAdd: BackgroundPiece | undefined;

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

		pcToImgMap.set(piece, img);
		imgToPcMap.set(img, piece);

		pieceToAdd = piece;
		pieceHolderEl.replaceChildren(img);
		btn.blur();
	});
	imgBtnList.appendChild(btn);
});

const mouse = {
	isDown: false,
	x: 0,
	y: 0,
};
document.addEventListener('mousemove', (e) => {
	mouse.x = e.x;
	mouse.y = e.y;

	if (mouse.isDown) {
		view.pos = Vec.add(view.pos, { x: e.movementX, y: e.movementY });
		mapContainer.style.translate = `${view.pos.x}px ${view.pos.y}px`;
	}

	if (!pieceToAdd) return;

	// Centre img on mouse
	const img = pcToImgMap.get(pieceToAdd)!;
	img.style.translate = `${e.x - pieceToAdd.w / 2}px ${
		e.y - pieceToAdd.h / 2
	}px`;
});

document.addEventListener('mousedown', () => (mouse.isDown = true));
document.addEventListener('mouseup', () => (mouse.isDown = false));

// Representing scale by larger integers to avoid decimal errors
const fullScale = 50;
const view = {
	scale: fullScale,
	pos: {
		x: 0,
		y: 0,
	},
};
document.addEventListener('wheel', (e) => {
	if (Math.abs(e.deltaY) > 1) {
		// Don't change scale when it goes beyond limits
		const newScale = view.scale + Math.sign(e.deltaY);
		if (newScale < fullScale * 0.1 || newScale > fullScale * 2) return;

		// Move towards mouse
		const ratio = 1 - newScale / view.scale;
		view.pos = Vec.add(Vec.mult(Vec.sub(mouse, view.pos), ratio), view.pos);
		mapContainer.style.translate = `${view.pos.x}px ${view.pos.y}px`;

		// Update scale
		view.scale = newScale;
		mapContainer.style.scale = String(view.scale / fullScale);
	}
});

document.addEventListener('keydown', (e) => {
	if (e.key !== ' ' || !pieceToAdd) return;

	// Check if it collides with any existing piece first

	// Add piece to map
	pieceToAdd.x = (mouse.x - pieceToAdd.w / 2 + view.pos.x) * view.scale;
	pieceToAdd.y = (mouse.y - pieceToAdd.h / 2 + view.pos.y) * view.scale;
	const img = pcToImgMap.get(pieceToAdd)!;
	mapContainer.appendChild(img);

	pieceToAdd = undefined;
});

// Get position when mouse hasn't move/page just loaded
// Apparently has been patched out? seems to work for me (firefox 103.0)
document.addEventListener('mouseover', (e) => {
	mouse.x = e.x;
	mouse.y = e.y;
});
