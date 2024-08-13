// ==UserScript==
// @name         SudokuPad Copy Paste
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Adds Copy and Paste keyboard shortcuts to Sven's SudokuPad
// @author       ThatComputerGuy
// @match        https://app.crackingthecryptic.com/sudoku/*
// @match        https://app.crackingthecryptic.com/*
// @exclude      https://app.crackingthecryptic.com/
// @exclude      https://app.crackingthecryptic.com/*.*
// @match        https://test.crackingthecryptic.com/sudoku/*
// @match        https://test.crackingthecryptic.com/*
// @exclude      https://test.crackingthecryptic.com/
// @exclude      https://test.crackingthecryptic.com/*.*
// @match        https://sudokupad.app/*
// @exclude      https://sudokupad.app/
// @exclude      https://sudokupad.app/*.*
// @match        https://beta.sudokupad.app/*
// @exclude      https://beta.sudokupad.app/
// @exclude      https://beta.sudokupad.app/*.*
// @match        https://alpha.sudokupad.app/*
// @exclude      https://alpha.sudokupad.app/
// @exclude      https://alpha.sudokupad.app/*.*
// @icon         https://app.crackingthecryptic.com/favicon.ico
// @grant        none
// @run-at       document-body
// ==/UserScript==

/* globals App, Puzzle, Replay */

(function () {
    'use strict';

    // TODO: Integrate this into the settings view
    const colSep = " ";
    const rowSep = "\n";
    const unselectedFill = " "; // Text to use for unselected cells
    const emptyFill = "."; // Text to use for empty cells, set to unselectedFill to treat empty cels as unselected

    // For paste, unselectedFill (" ") will leave cells unmodified, whereas emptyFill(".") will clear cells

    document.body.addEventListener("appPrepared", () => {
        const delegateKeydown = App.prototype.handleKeydown;
        App.prototype.handleKeydown = function (event) {
            this.currentEvent = event;
            this.updateKeys(event);
            if (this.controlPressed && event.key.toLowerCase() === 'c') {
                this.act({ type: "copy" });
            } else if (this.controlPressed && event.key.toLowerCase() === 'v') {
                this.act({ type: "paste" });
            } else {
                delegateKeydown.call(this, event);
            }
        };

        if (!("cp" in Puzzle.ActionShortToLong) && !("ps" in Puzzle.ActionShortToLong)) {
            Puzzle.ActionLongToShort.copy = "cp";
            Puzzle.ActionLongToShort.paste = "ps";
            Puzzle.ActionShortToLong.cp = "copy";
            Puzzle.ActionShortToLong.ps = "paste";

            const tSepA = '/';
            Replay.actA.push("cp");
            Replay.actA.push("ps");
            Replay.reActA = new RegExp(`(${Replay.actA.join('|')})(?:\:([^${tSepA},]+))?(?:${tSepA}([0-9]+))?`, 'ig');
        } else {
            throw new Error("Copy/Paste short action names collide with native app actions!")
        }

        const delegateAct = Puzzle.prototype.act;
        Puzzle.prototype.act = function (action) {
            try {
                var paction = this.parseAction(action);
                var act = this.actionToString(paction);
            }
            catch (err) {
                console.error('Puzzle.act > action parse error:', err);
                console.info('  action:', paction);
                return;
            }
            //console.info('Puzzle.act("%s");', act, action);
            if (paction.type === 'copy') {
                this.execCopy(); // Copy does not get saved in replay data; clipboard data is saved with paste
                this.trigger('act', act, paction);
            }
            else if (paction.type === 'paste') {
                new Promise(async () => {
                    if (paction.arg == undefined) {
                        paction.arg = await navigator.clipboard.readText();
                        act = this.actionToString(paction);
                    }

                    if (this.execPaste(paction.arg)) {
                        this.logReplayAct(act);

                        this.redoStack.length = 0;
                        this.undoSelection = 0;
                        this.logUndoAct(act);
                    }
                    this.trigger('act', act, paction);
                })
            }
            else {
                // Action handled by default app
                delegateAct.call(this, action);
            }
        };

        const delegateExec = Puzzle.prototype.exec;
        Puzzle.prototype.exec = function (action) {
            var { type, arg } = this.parseAction(action)
            if (type == "paste") {
                return this.execPaste(arg)
            } else {
                return delegateExec.call(this, action)
            }
        };

        Puzzle.prototype.execCopy = function () {
            // Might make this async once the core supports it
            // If anything is selected,
            if (this.selectedCells.length > 0) {
                // Find selection bounds
                const cols = this.selectedCells.map(cell => cell.col);
                const rows = this.selectedCells.map(cell => cell.row);
                const minCol = Math.min(...cols);
                const minRow = Math.min(...rows);
                const maxCol = Math.max(...cols);
                const maxRow = Math.max(...rows);
                const width = maxCol - minCol + 1;
                const height = maxRow - minRow + 1;

                // Copy selected cell values into a 2d array for processing
                let cellData = new Array(height).fill(null).map(() => new Array(width).fill(null));
                for (const cell of this.selectedCells) {
                    cellData[cell.row - minRow][cell.col - minCol] = cell.given ?? cell.value;
                }

                // Convert cell data to string
                let clipboardData = cellData.map(
                    row => row.map(
                        cell => cell === null ? unselectedFill : cell === undefined ? emptyFill : cell.toString()
                    ).join(colSep)
                ).join(rowSep);

                // Save text to clipboard
                navigator.clipboard.writeText(clipboardData).catch(() => {
                    console.error("Unable to save cells to clipboard");
                });

                return true;
            }
            return false;
        };

        Puzzle.prototype.execPaste = function (text) {
            // If the clipboard contains text that is composed of valid characters

            if (new RegExp(/^[0-9A-Z. \n]+$/).test(text)) {
                // Break up the input string into a 2d array
                let pasteData = text.split(rowSep).map(row => row.split(colSep));

                // If it is possible for the grid to be mismatched,
                if (colSep !== "" && unselectedFill !== "" && emptyFill !== "") {
                    // Filter out double-empties, indicating the column separator was mismatched
                    pasteData = pasteData.map(row => row.reduce((newRow, cell) => {
                        if (cell === "" && newRow[newRow.length - 1] === "") {
                            newRow[newRow.length - 1] = colSep; // Replace double empty string with the column seperator
                        } else {
                            newRow.push(cell); // Add the new value to the row
                        }
                        return newRow;
                    }, []));
                }
                console.log(pasteData);

                const firstCol = pasteData[0].findIndex(cell => cell !== unselectedFill)
                const topRow = Math.min(this.selectedCells.map(cell => cell.row))
                const leftCol = Math.min(this.selectedCells.filter(cell => cell.row === topRow).map(cell => cell.col))
                let res = false;
                for (let row = 0, gridRow = topRow; row < pasteData.length; row++, gridRow++) {
                    for (let col = 0, gridCol = leftCol - firstCol; col < pasteData[0].length; col ++, gridCol ++) {
                        if (pasteData[row][col] === unselectedFill) {
                            continue;
                        } else if (pasteData[row][col] === emptyFill) {
                            res = true;
                            this.grid.getCell(gridRow, gridCol).clearProp("normal")
                        } else {
                            res = true;
                            this.grid.getCell(gridRow, gridCol).propSet("normal", pasteData[row][col])
                        }
                    }
                }
                return res;
            }

        };
    });
})();
