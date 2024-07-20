// ==UserScript==
// @name         CTC Restore Given Pencilmark
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adjusts the clear function for given pencilmark cells to toggle between given pencilmarks and an empty cell
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

/* globals Cell */

(function() {
    'use strict';
    document.body.addEventListener("appPrepared", () => {
        Cell.prototype.clearCandidates = function() {
            if(this.candidates.length === 0) return false;
            if (!(
                this.candidates.length === this.givenCentremarks.length &&
                this.candidates.every((val, i) => val == this.givenCentremarks[i])
            )) {
                this.candidates.length = 0;
                this.toggleProp('centre', (this.givenCentremarks || []), true);
            } else {
                this.candidates.length = 0;
            }
            return true;
        };
        Cell.prototypeclearPencilmarks = function() {
            if(this.pencilmarks.length === 0) return false;
            if (!(
                this.pencilmarks.length === this.givenPencilmarks.length &&
                this.pencilmarks.every((val, i) => val == this.givenPencilmarks[i])
            )) {
                this.pencilmarks.length = 0;
                this.toggleProp('corner', (this.givenPencilmarks || []), true);
            } else {
                this.pencilmarks.length = 0;
            }
            return true;
        };
    });
})();