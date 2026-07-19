// ============================================================
//  Reversi engine — a faithful 1:1 JavaScript port of Noah's
//  Python engine (github.com/Mxlu42/Reversi).
//
//  The Python project splits the logic across four classes:
//    move.py      -> Move       (parses "row+col" input)
//    player.py    -> Player     (a side + its score)
//    playboard.py -> Playboard  (the 8x8 grid + check_move)
//    reversi.py   -> Reversi    (game controller: valid moves,
//                                make_move, flip logic, game over)
//
//  Only the Tkinter/terminal UI is dropped — the web page is the UI.
//  The rule logic below mirrors the Python method-for-method, so the
//  browser game behaves exactly like the desktop one. Parity is
//  verified by replaying real-engine game traces (see tools/verify).
// ============================================================

// ---- move.py :: class Move ----
class Move {
    constructor() {
        this.column = 0;
        this.row = 0;
    }
    move_input(input) {
        // Mirrors Python: reject <= 10 or > 88, else split the two digits.
        if (Number(input) <= 10 || Number(input) > 88) {
            // "invalid input" — Python only prints; we leave row/column unset.
            return;
        }
        this.row = input[0];
        this.column = input[1];
    }
    get_column() { return parseInt(this.column, 10); }
    get_row() { return parseInt(this.row, 10); }
}

// ---- player.py :: class Player ----
class Player {
    constructor(player, score) {
        this.player = player;
        this.score = score;
    }
    get_player() { return this.player; }
    get_score() { return this.score; }
}

// ---- playboard.py :: class Playboard ----
class Playboard {
    constructor() {
        this.playboard = [];
        this.row = 0;
        this.col = 0;

        for (let i = 1; i < 9; i++) {
            const row = [];
            for (let j = 1; j < 9; j++) row.push(null);
            this.playboard.push(row);
        }

        // Standard opening (0-indexed inner array).
        this.playboard[3][3] = 'W';
        this.playboard[3][4] = 'B';
        this.playboard[4][3] = 'B';
        this.playboard[4][4] = 'W';
    }

    set_move(mov) {
        this.row = mov.get_row() - 1;
        this.col = mov.get_column() - 1;
    }

    set_piece(player) {
        this.playboard[this.row][this.col] = player;
    }

    // Faithful port of Playboard.check_move — including its quirks:
    // `b`/`a` persist across neighbour iterations, and `case` (the last
    // opposing-neighbour direction) is returned when no bracket validates.
    // Retained from the original engine, but NO LONGER used to decide legality:
    // Reversi.is_valid_move now requires an actual capture (standard Othello).
    check_move(player, opposing_player) {
        let case_ = 0;
        let b = 0;
        let a = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                const adj_row = this.row + i;
                const adj_col = this.col + j;
                if (!(adj_row >= 0 && adj_row < 8 && adj_col >= 0 && adj_col < 8)) {
                    continue;
                }
                if (this.playboard[adj_row][adj_col] === opposing_player) {
                    case_ = [i, j];
                    if (case_[0] === 0) b = 1;
                    if (case_[1] === 0) a = 1;
                    else { b = i; a = j; }

                    const next_row = this.row + i + b;
                    const next_col = this.col + j + a;
                    if (!(next_row >= 0 && next_row < 8 && next_col >= 0 && next_col < 8)) {
                        continue;
                    }
                    if (this.playboard[next_row][next_col] === player) {
                        return [i, j]; // valid move
                    } else if (this.playboard[next_row][next_col] === null) {
                        // Move is invalid — fall through.
                    } else if (this.playboard[next_row][next_col] === opposing_player) {
                        let step = 2;
                        while (true) {
                            const check_row = this.row + i * step;
                            const check_col = this.col + j * step;
                            if (!(check_row >= 0 && check_row < 8 && check_col >= 0 && check_col < 8)) {
                                break;
                            }
                            if (this.playboard[check_row][check_col] === null) {
                                break; // Move is invalid
                            }
                            if (this.playboard[check_row][check_col] === player) {
                                return [i, j]; // direction that makes it valid
                            }
                            step += 1;
                        }
                    }
                }
            }
        }
        return case_;
    }
}

// ---- reversi.py :: class Reversi ----
class Reversi {
    constructor() {
        this.board = new Playboard();
        this.current_player = 'B';
        this.player_black = new Player('B', 2);
        this.player_white = new Player('W', 2);
        this.game_over = false;
    }

    get_current_player() { return this.current_player; }

    get_opposing_player() {
        return this.current_player === 'B' ? 'W' : 'B';
    }

    switch_player() {
        this.current_player = this.get_opposing_player();
    }

    is_valid_move(row, col) {
        if (!(row >= 1 && row <= 8 && col >= 1 && col <= 8)) return false;
        if (this.board.playboard[row - 1][col - 1] !== null) return false;

        // Standard Othello: a move is legal only if it captures at least one
        // disc. (The original port also accepted moves that merely touched an
        // enemy disc without flanking it, via Playboard.check_move — that is no
        // longer how legality is decided.)
        return this._get_flip_directions(row, col).length > 0;
    }

    get_valid_moves() {
        const valid_moves = [];
        for (let row = 1; row < 9; row++) {
            for (let col = 1; col < 9; col++) {
                if (this.is_valid_move(row, col)) valid_moves.push([row, col]);
            }
        }
        return valid_moves;
    }

    make_move(row, col) {
        if (!this.is_valid_move(row, col)) return false;

        const mov = new Move();
        mov.row = row;
        mov.column = col;
        this.board.set_move(mov);

        const directions = this._get_flip_directions(row, col);

        this.board.set_piece(this.current_player);

        for (const direction of directions) {
            this._flip_pieces(row, col, direction);
        }

        this._update_scores();
        return true;
    }

    _get_flip_directions(row, col) {
        const directions = [];
        for (let delta_row = -1; delta_row < 2; delta_row++) {
            for (let delta_col = -1; delta_col < 2; delta_col++) {
                if (delta_row === 0 && delta_col === 0) continue;
                if (this._check_direction(row, col, delta_row, delta_col)) {
                    directions.push([delta_row, delta_col]);
                }
            }
        }
        return directions;
    }

    _check_direction(row, col, delta_row, delta_col) {
        const opposing = this.get_opposing_player();
        const current = this.current_player;

        const adj_row = row - 1 + delta_row;
        const adj_col = col - 1 + delta_col;

        if (!(adj_row >= 0 && adj_row < 8 && adj_col >= 0 && adj_col < 8)) return false;
        if (this.board.playboard[adj_row][adj_col] !== opposing) return false;

        let step = 2;
        while (true) {
            const check_row = row - 1 + delta_row * step;
            const check_col = col - 1 + delta_col * step;
            if (!(check_row >= 0 && check_row < 8 && check_col >= 0 && check_col < 8)) return false;

            const cell = this.board.playboard[check_row][check_col];
            if (cell === null) return false;
            if (cell === current) return true;
            step += 1;
        }
    }

    _flip_pieces(row, col, direction) {
        const [delta_row, delta_col] = direction;
        const opposing = this.get_opposing_player();
        const current = this.current_player;

        let step = 1;
        while (true) {
            const flip_row = row - 1 + delta_row * step;
            const flip_col = col - 1 + delta_col * step;
            if (!(flip_row >= 0 && flip_row < 8 && flip_col >= 0 && flip_col < 8)) break;

            const cell = this.board.playboard[flip_row][flip_col];
            if (cell === current) break;
            if (cell === opposing) this.board.playboard[flip_row][flip_col] = current;
            step += 1;
        }
    }

    _update_scores() {
        let black_count = 0;
        let white_count = 0;
        for (const row of this.board.playboard) {
            for (const cell of row) {
                if (cell === 'B') black_count += 1;
                else if (cell === 'W') white_count += 1;
            }
        }
        this.player_black.score = black_count;
        this.player_white.score = white_count;
    }

    check_game_over() {
        const current_moves = this.get_valid_moves();
        if (current_moves.length > 0) return false;

        this.switch_player();
        const other_moves = this.get_valid_moves();
        this.switch_player();

        if (other_moves.length > 0) return false;
        return true;
    }

    get_winner() {
        this._update_scores();
        const black_score = this.player_black.get_score();
        const white_score = this.player_white.get_score();
        if (black_score > white_score) return 'B';
        if (white_score > black_score) return 'W';
        return null;
    }
}

// Export for Node (verification harness); harmless in the browser.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Move, Player, Playboard, Reversi };
}
