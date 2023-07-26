import { BackgroundPiece } from './backgroundPiece.js';

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

{
	const info = imgList[0];
	const piece: BackgroundPiece = {
		x: innerWidth / 2 - info.w / 2,
		y: innerHeight / 2 - info.h / 2,
		w: info.w,
		h: info.h,
		src: info.src,
		bridges: [],
	};

	const img = document.createElement('img');
	img.src = `assets/${info.src}`;
	img.width = info.w;
	img.height = info.h;
	img.style.translate = `${piece.x}px ${piece.y}px`;

	pcToImgMap.set(piece, img);
	imgToPcMap.set(img, piece);
	mapContainer.appendChild(img);
}

const mouse = {
	x: 0,
	y: 0,
};
document.addEventListener('mousemove', (e) => {
	mouse.x = e.x;
	mouse.y = e.y;

	if (!pieceToAdd) return;

	// Centre img on mouse
	const img = pcToImgMap.get(pieceToAdd)!;
	img.style.translate = `${e.x - pieceToAdd.w / 2}px ${
		e.y - pieceToAdd.h / 2
	}px`;
});

// Representing scale by 100 to avoid decimal errors
const scaleFull = 50;
const view = {
	scale: scaleFull,
	x: 0,
	y: 0,
};
document.addEventListener('wheel', (e) => {
	if (Math.abs(e.deltaY) > 1) {
		// Change scale
		const oldScale = view.scale / scaleFull;
		const newScale = view.scale + Math.sign(e.deltaY);
		if (newScale < scaleFull * 0.1 || newScale > scaleFull * 2) return;

		view.scale = newScale;
		worldContainer.style.scale = String(view.scale / scaleFull);

		// Move towards mouse
		// const pos = [
		// 	(mouse.x - innerWidth / 2) * oldScale,
		// 	(mouse.y - innerHeight / 2) * oldScale,
		// ];
		// const new_pos = pos.map((n) => n * (view.scale / scaleFull));
		// view.x -= new_pos[0] - pos[0];
		// view.y -= new_pos[1] - pos[1];
		// mapContainer.style.translate = `${view.x}px ${view.y}px`;
		// // console.log([0, 1].map((i) => new_pos[i] - pos[i]));
		// console.table({
		// 	old: pos,
		// 	new: new_pos,
		// 	change: [0, 1].map((i) => new_pos[i] - pos[i]),
		// });
	}
});

document.addEventListener('keydown', (e) => {
	if (e.key !== ' ' || !pieceToAdd) return;

	// Check if it collides with any existing piece first

	// Add piece to map
	pieceToAdd.x = (mouse.x - pieceToAdd.w / 2 + view.x) * view.scale;
	pieceToAdd.y = (mouse.y - pieceToAdd.h / 2 + view.y) * view.scale;
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

const centre1 = document.createElement('div');
const centre2 = document.createElement('div');
centre2.className = centre1.className = 'centre';
centre2.style.backgroundColor = 'blue';
document.body.append(centre1);
mapContainer.append(centre2);
