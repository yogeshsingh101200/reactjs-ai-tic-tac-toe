import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';


function actions(squares) {
    let set = new Set();
    squares.forEach((square, index) => {
        if (!square) {
            set.add(index);
        }
    });
    return set;
}


function player(squares) {
    let cnt1 = 0;
    let cnt2 = 0;
    for (let square of squares) {
        if (square === 'X') ++cnt1;
        else if (square === 'O') ++cnt2;
    }
    if (cnt1 > cnt2) return 'O';
    else return 'X';
}

function result(squares, action) {
    const updated_squares = squares.slice();
    updated_squares[action] = player(squares);
    return updated_squares;
}

function terminal(squares) {
    if (calculateWinner(squares)) return true;
    for (let square of squares) {
        if (!square) return false;
    }
    return true;
}

function utility(squares) {
    const W = calculateWinner(squares);
    let score;
    if (W === "X") score = 10;
    else if (W === "O") score = -10;
    else score = 0;
    return score;
}

function maxvalue(squares, depth) {
    if (terminal(squares)) {
        const score = utility(squares);
        if (score > 0) return score - depth;
        else if (score < 0) return score + depth;
        return score;
    }
    let v = -Infinity;
    for (let action of actions(squares)) {
        v = Math.max(v, minvalue(result(squares, action), depth + 1));
    }
    return v;
}


function minvalue(squares, depth) {
    if (terminal(squares)) {
        const score = utility(squares);
        if (score > 0) return score - depth;
        else if (score < 0) return score + depth;
        return score;
    }
    let v = Infinity;
    for (let action of actions(squares)) {
        v = Math.min(v, maxvalue(result(squares, action), depth + 1));
    }
    return v;
}

function minimax(squares) {
    // assuming ai is playing as O
    // todo: remove assumption
    let optimal_score = Infinity;
    let optimal_state = null;

    for (let state of actions(squares)) {
        let val = maxvalue(result(squares, state), 0);
        if (val < optimal_score) {
            optimal_score = val;
            optimal_state = state;
        }
    }
    return optimal_state;
}


function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}

const boardmap = [
    'top left', 'top', 'top right',
    'middle left', 'middle', 'middle right',
    'bottom left', 'bottom', 'bottom right'
];

function Square(props) {
    if (props.onClick) {
        return (
            <button className={`square ${boardmap[props.location]}`} onClick={props.onClick}>
                {props.value}
            </button>
        );
    } else {
        return (
            <button className={`square ${boardmap[props.location]}`}>
                {props.value}
            </button>
        );
    }
}

class Board extends React.Component {
    renderSquare(i) {
        if (this.props.onClick) {
            return (
                <Square
                    value={this.props.squares[i]}
                    location={i}
                    onClick={() => { this.props.onClick(i); }}
                />
            );
        } else {
            return (
                <Square
                    value={this.props.squares[i]}
                    location={i}
                />
            );
        }
    }

    render() {
        return (
            <div>
                <div className="board-row">
                    {this.renderSquare(0)}
                    {this.renderSquare(1)}
                    {this.renderSquare(2)}
                </div>
                <div className="board-row">
                    {this.renderSquare(3)}
                    {this.renderSquare(4)}
                    {this.renderSquare(5)}
                </div>
                <div className="board-row">
                    {this.renderSquare(6)}
                    {this.renderSquare(7)}
                    {this.renderSquare(8)}
                </div>
            </div>
        );
    }
}

class Game extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            history: [{
                squares: Array(9).fill(null),
            }],
            stepNumber: 0,
            xIsNext: true,
        };
    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = this.state.history[history.length - 1];
        const squares = current.squares.slice();
        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        squares[i] = this.state.xIsNext ? "X" : "O";
        this.setState({
            history: history.concat([{
                squares: squares
            }]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext,
        });
    };

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0,
        });
    }

    makeAiMove() {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = this.state.history[history.length - 1];
        const squares = current.squares.slice();
        const move = minimax(squares);
        if (calculateWinner(squares) || squares[move]) {
            return;
        }
        squares[move] = this.state.xIsNext ? "X" : "O";
        this.setState({
            history: history.concat([{
                squares: squares
            }]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext,
        });
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares);

        let undo;
        if (!this.state.stepNumber) {
            undo = <button className="btn btn-success" disabled>Undo</button>;
        } else {
            const move = this.state.stepNumber - 2;
            undo = <button
                className="btn btn-success"
                onClick={() => { this.jumpTo(move); }}>Undo</button>;

        }

        let status;
        if (winner) {
            status = <div className="winner">Winner: {winner}</div>;
        } else {
            const tie = terminal(current.squares);
            if (tie) status = <div className="tie">Tie</div>;
            else status = `Turn : ${this.state.xIsNext ? 'X' : 'O'}`;
        }

        if (!this.state.xIsNext) {
            setTimeout(() => {
                this.makeAiMove();
            }, 500);
            return (
                <div className="game">
                    <div className="game-status">{status}</div>
                    <div className="game-board">
                        <Board
                            squares={current.squares}
                        />
                    </div>
                    <div className="game-info">
                        <button className="btn btn-success" disabled>Undo</button>
                        <button
                            className="btn btn-success"
                            onClick={() => { this.jumpTo(0); }}
                        >
                            Restart
                        </button>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="game">
                    <div className="game-status">{status}</div>
                    <div className="game-board">
                        <Board
                            squares={current.squares}
                            onClick={i => { this.handleClick(i); }}
                        />
                    </div>
                    <div className="game-info">
                        {undo}
                        <button
                            className="btn btn-success"
                            onClick={() => { this.jumpTo(0); }}
                        >
                            Restart
                        </button>
                    </div>
                </div>
            );
        }
    }
}

// ========================================

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);
