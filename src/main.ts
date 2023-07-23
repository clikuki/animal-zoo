// CATS: api.thecatapi.com

class Vec {
	x: number;
	y: number;

	static add(a: Vec, b: number | Vec): Vec {
		const isNumber = typeof b === 'number';
		return {
			x: a.x + (isNumber ? b : b.x),
			y: a.y + (isNumber ? b : b.y),
		};
	}
	static sub(a: Vec, b: number | Vec): Vec {
		const isNumber = typeof b === 'number';
		return {
			x: a.x - (isNumber ? b : b.x),
			y: a.y - (isNumber ? b : b.y),
		};
	}
	static mult(a: Vec, b: number | Vec): Vec {
		const isNumber = typeof b === 'number';
		return {
			x: a.x * (isNumber ? b : b.x),
			y: a.y * (isNumber ? b : b.y),
		};
	}
	static div(a: Vec, b: number | Vec): Vec {
		const isNumber = typeof b === 'number';
		return {
			x: a.x / (isNumber ? b : b.x),
			y: a.y / (isNumber ? b : b.y),
		};
	}

	static distance(a: Vec, b: Vec): number {
		return Math.hypot(b.x - a.x, b.y - a.y);
	}
	static magnitude(a: Vec): number {
		return Math.hypot(a.x, a.y);
	}
	static normalize(a: Vec): Vec {
		return this.div(a, this.magnitude(a));
	}
	static setMag(a: Vec, s: number): Vec {
		return this.mult(this.normalize(a), s);
	}
}

function randInt(min: number, max: number): number {
	return Math.random() * (max - min + 1) + min;
}

function constrainNumber(n: number, min: number, max: number): number {
	return Math.min(Math.max(n, min), max);
}

class Animal {
	readonly sprite: HTMLImageElement;

	// Should never be updated
	readonly w: number;
	readonly h: number;

	// Proxy the position so that the sprite's position updates with the code
	#pos = (() => {
		const position = { x: 0, y: 0 };
		return {
			p: position,
			proxy: new Proxy(position, {
				set: (pos, prop, val) => {
					if (Reflect.set(pos, prop, val)) {
						// Position at the center rather than top left corner
						const screenPos = {
							x: this.#pos.p.x - this.w / 2,
							y: this.#pos.p.y - this.h / 2,
						};
						this.sprite.style.translate = `${screenPos.x}px ${screenPos.y}px`;
						return true;
					} else return false;
				},
			}),
		};
	})();
	get pos() {
		return this.#pos.proxy;
	}
	set pos(v) {
		this.#pos.p.x = v.x;
		this.#pos.p.y = v.y;
		const screenPos = {
			x: v.x - this.w / 2,
			y: v.y - this.h / 2,
		};
		this.sprite.style.translate = `${screenPos.x}px ${screenPos.y}px`;
	}

	// MOVEMENT
	#movementMode: 'WANDER' | 'GOTO' = 'WANDER';
	#wanderDelayRange: [number, number] = [500, 2000];
	#wanderDelayCur = randInt(...this.#wanderDelayRange);
	#destination: Vec | null;

	constructor(x: number, y: number, w: number, h: number, url: string) {
		// Create img
		this.sprite = document.createElement('img');
		this.sprite.classList.add('entity');
		this.sprite.src = url;

		// Set size
		this.w = w;
		this.h = h;
		this.sprite.style.width = w + 'px';
		this.sprite.style.height = h + 'px';

		// Set position
		this.pos = { x, y };
	}

	move(delta: number): void {
		if (this.#movementMode === 'WANDER' && !this.#destination) {
			// Generate destination within a radius
			// Actually a square since thats easier
			const wanderRadius = 500;
			const edgeMargin = 10;

			if (this.#wanderDelayCur <= 0) {
				// creates a box centered around the origin, and offsets it towards our position
				// then constrains it to the screens bounds, taking into account the size and centering of the sprite
				// biased towards edges, since constraining sends points back to nearby area
				this.#destination = {
					x: constrainNumber(
						Math.random() * wanderRadius * 2 - wanderRadius + this.pos.x,
						this.w / 2 + edgeMargin,
						innerWidth - this.w / 2 - edgeMargin,
					),
					y: constrainNumber(
						Math.random() * wanderRadius * 2 - wanderRadius + this.pos.y,
						this.h / 2 + edgeMargin,
						innerHeight - this.h / 2 - edgeMargin,
					),
				};
			} else this.#wanderDelayCur -= delta;
		}

		if (this.#destination) {
			const speed = this.#movementMode === 'WANDER' ? 2 : 5;
			this.pos = Vec.add(
				Vec.setMag(Vec.sub(this.#destination, this.pos), speed),
				this.pos,
			);

			const distFromDest = Vec.distance(this.#destination, this.pos);
			if (distFromDest < 1) {
				this.#destination = null;
				this.#wanderDelayCur = randInt(...this.#wanderDelayRange);
				this.#movementMode = 'WANDER';
			}
		}
	}
}

const entityContainerElem = document.querySelector(
	'.entities',
) as HTMLDivElement;
const catScale = 0.1;

const animals: Animal[] = [];
// Makes animals move at the different times
(() => {
	let id = setInterval(() => {
		const w = 960 * catScale;
		const h = 1280 * catScale;
		const animal = new Animal(
			Math.random() * (innerWidth - w) + w / 2,
			Math.random() * (innerHeight - h) + h / 2,
			w,
			h,
			'testCat.jpg',
		);
		entityContainerElem.appendChild(animal.sprite);
		animals.push(animal);
		if (animals.length >= 10) clearInterval(id);
	}, 500);
})();

let pt = 0;
requestAnimationFrame(function loop(t) {
	requestAnimationFrame(loop);

	const delta = t - pt;
	pt = t;

	for (const animal of animals) {
		animal.move(delta);
	}
});
