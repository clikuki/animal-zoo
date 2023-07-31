export interface Rectangle {
	w: number;
	h: number;
	x: number;
	y: number;
}

// Pieces will have bridges that connect to other pieces,
// using another Bridge to ignore the piece's edge collision

export interface BackgroundPiece extends Rectangle {
	src: string;
	bridges: Bridge[];
}

export interface Bridge extends Rectangle {
	connecting: [BackgroundPiece, BackgroundPiece];
}
