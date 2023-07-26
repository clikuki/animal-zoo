export class Vec {
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
