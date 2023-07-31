import { BackgroundPiece, Rectangle } from './backgroundPiece.js';
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

type Matrix<T> = T[][];
class Grid<T> {
	#m: Matrix<T> = [];
	constructor(public s: number) {}

	#trueIndex(p: Vec): Vec {
		// Snap to grid
		return Vec.mult(Vec.floor(Vec.div(p, this.s)), this.s);
	}
	has(p: Vec): boolean {
		const { x, y } = this.#trueIndex(p);
		if (!this.#m[x]) return false;
		return this.#m[x][y] !== undefined;
	}
	get(p: Vec): T | undefined {
		const { x, y } = this.#trueIndex(p);
		if (!this.#m[x]) return undefined;
		return this.#m[x][y];
	}
	set(p: Vec, item: T | null): void {
		const { x, y } = this.#trueIndex(p);
		if (!this.#m[x]) this.#m[x] = [];
		if (item === null) delete this.#m[x][y];
		else this.#m[x][y] = item;
	}
}

const grids = [
	// For occupancy checking
	['coarse', new Grid<boolean>(500)], // 1-500
	['medium', new Grid<boolean>(200)], // 1-200
	// Where pieces are actually stored
	['fine', new Grid<BackgroundPiece[]>(50)], // 1-50
] as const;

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

// View position must be subtracted instead of added because of the way the Camera works
// In short, adding to x/y moves the Camera up/left instead of down/right, respectively
function mouseToWorld(w: number, h: number): Vec {
	const scale = view.scale / fullScale;
	return {
		x: (mouse.x - view.pos.x) / scale - w / 2,
		y: (mouse.y - view.pos.y) / scale - h / 2,
	};
}

function RectToRectCollision(a: Rectangle, b: Rectangle): boolean {
	return (
		a.x + a.w > b.x && //
		a.x < b.x + b.w &&
		a.y + a.h > b.y &&
		a.y < b.y + b.h
	);
}

function isColliding(a: BackgroundPiece): boolean {
	let checkFor = [{ ...a }] as Rectangle[];
	for (const [type, grid] of grids) {
		const newChecks = [] as typeof checkFor;

		for (const rect of checkFor) {
			for (let x = rect.x; ; x += grid.s) {
				for (let y = rect.y; ; y += grid.s) {
					// Check grids
					if (grid.has({ x, y })) {
						if (type === 'fine') {
							// Begin narrow search
							const pieces = grid.get({ x, y }) as BackgroundPiece[];
							for (const piece of pieces) {
								if (piece !== a && RectToRectCollision(piece, a)) return true;
							}
						} else {
							// Continue checking deeper
							newChecks.push({
								x,
								y,
								w: grid.s,
								h: grid.s,
							});
						}
					}

					if (y >= rect.y + rect.h) break;
				}
				if (x >= rect.x + rect.w) break;
			}
		}

		if (newChecks.length === 0) break;
		checkFor = newChecks;
	}
	return false;
}

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

		pieceHolderEl.style.cssText = `
		translate: ${mouse.x - info.w / 2}px ${mouse.y - info.h / 2}px;
		scale: ${view.scale / fullScale};
		width: ${info.w}px;
		height: ${info.h}px;
		`;

		pcToImgMap.set(piece, img);
		imgToPcMap.set(img, piece);

		pieceToAdd = piece;
		pieceHolderEl.replaceChildren(img);
		btn.blur();
	});
	imgBtnList.appendChild(btn);
});

document.addEventListener('mousemove', (e) => {
	if (mouse.isDown) {
		view.pos = Vec.add(view.pos, Vec.sub(e, mouse));
		mapContainer.style.translate = `${view.pos.x}px ${view.pos.y}px`;
	}
	mouse.x = e.x;
	mouse.y = e.y;
	// projectedMousePosition();

	if (!pieceToAdd) return;

	// Centre piece on mouse
	pieceHolderEl.style.translate = `${e.x - pieceToAdd.w / 2}px ${
		e.y - pieceToAdd.h / 2
	}px`;
	const piecePos = mouseToWorld(pieceToAdd.w, pieceToAdd.h);
	pieceToAdd.x = piecePos.x;
	pieceToAdd.y = piecePos.y;

	if (isColliding(pieceToAdd)) {
		pieceHolderEl.classList.add('invalid');
	} else {
		pieceHolderEl.classList.remove('invalid');
	}
});

// Get position when mouse hasn't move/page just loaded
// Apparently has been patched out? seems to work for me (firefox 103.0)
document.addEventListener('mouseover', (e) => {
	mouse.x = e.x;
	mouse.y = e.y;
	// projectedMousePosition();

	if (!pieceToAdd) return;

	const piecePos = mouseToWorld(pieceToAdd.w, pieceToAdd.h);
	pieceToAdd.x = piecePos.x;
	pieceToAdd.y = piecePos.y;

	if (isColliding(pieceToAdd)) {
		pieceHolderEl.classList.add('invalid');
	} else {
		pieceHolderEl.classList.remove('invalid');
	}
});

document.addEventListener('mousedown', () => (mouse.isDown = true));
document.addEventListener('mouseup', () => (mouse.isDown = false));

document.addEventListener('wheel', (e) => {
	if (Math.abs(e.deltaY) > 1) {
		// Don't change scale when it goes beyond limits
		const newScale = view.scale - Math.sign(e.deltaY);
		if (newScale < fullScale * 0.1 || newScale > fullScale * 2) return;

		// Move towards mouse
		const ratio = 1 - newScale / view.scale;
		view.pos.x += (mouse.x - view.pos.x) * ratio;
		view.pos.y += (mouse.y - view.pos.y) * ratio;
		mapContainer.style.translate = `${view.pos.x}px ${view.pos.y}px`;

		// Update scale
		view.scale = newScale;
		mapContainer.style.scale = String(view.scale / fullScale);
		pieceHolderEl.style.scale = String(view.scale / fullScale);

		// projectedMousePosition();
	}
});

document.addEventListener('keydown', (e) => {
	if (e.key !== ' ' || !pieceToAdd) return;

	// Check if it collides with any existing piece first
	if (isColliding(pieceToAdd)) return;

	// Add piece to map
	const img = pcToImgMap.get(pieceToAdd)!;
	img.style.translate = `${pieceToAdd.x}px ${pieceToAdd.y}px`;
	img.style.removeProperty('scale');
	mapContainer.appendChild(img);

	// Update grids
	for (const [type, grid] of grids) {
		for (let x = pieceToAdd.x; ; x += grid.s) {
			for (let y = pieceToAdd.y; ; y += grid.s) {
				if (type === 'fine') {
					let fineArray = grid.get({ x, y });
					if (!fineArray) {
						fineArray = [];
						grid.set({ x, y }, fineArray);
					}
					fineArray.push(pieceToAdd);
				} else grid.set({ x, y }, true);

				if (y >= pieceToAdd.y + pieceToAdd.h) break;
			}
			if (x >= pieceToAdd.x + pieceToAdd.w) break;
		}
	}

	// Reset holder variables
	pieceHolderEl.classList.remove('invalid');
	pieceToAdd = undefined;
});

// function projectedMousePosition() {
// 	const scale = view.scale / fullScale;
// 	const x = (mouse.x - view.pos.x) / scale - 5;
// 	const y = (mouse.y - view.pos.y) / scale - 5;
// 	mousePos.style.translate = `${x}px ${y}px`;
// 	mousePos.innerHTML = `
// 	<div style='translate: 0px -2.5rem; display: grid; place-content: center;'>
// 		${+(x + 5 - (pieceToAdd?.w ?? 0) / 2).toFixed(2)}
// 		${+(y + 5 - (pieceToAdd?.h ?? 0) / 2).toFixed(2)}
// 	</div>
// 	`;
// }
// const mousePos = document.createElement('div');
// mousePos.style.cssText = `
// 	position: absolute;
// 	width: 10px;
// 	height: 10px;
// 	background: red;
// 	z-index: 99999;
// 	pointer-events: none;
// 	color: white;
// 	text-align: center;
// `;
// mapContainer.append(mousePos);
