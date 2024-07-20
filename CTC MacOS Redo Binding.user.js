// ==UserScript==
// @name         CTC MacOS Redo Binding
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds the MacOS Redo binding (CMD-Shift-Z) to the CTC web app
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

/* globals ToolLetter_tool */

(function() {
    'use strict';

    document.body.addEventListener("appPrepared", () => {
        const delegateKeydown = App.prototype.handleKeydown;
        App.prototype.handleKeydown = function (event) {
            this.currentEvent = event;
            this.updateKeys(event);
            if (this.controlPressed && event.key.toLowerCase() === 'z' && this.shiftPressed) {
                this.act({type: "redo"});
            } else {
                delegateKeydown.call(this, event);
            }
        }
    });
})();