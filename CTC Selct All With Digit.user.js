// ==UserScript==
// @name         CTC Selct All With Digit
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  When a number is triple-clicked, select all cells that contain that number even in pencil marks. Also adds a more narrow double-click filter for colors and shifts the original logic to triple-click.
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

/* globals App */

(function() {
    'use strict';

    document.body.addEventListener("appPrepared", () => {
        const delegateInputdown = App.prototype.handleInputdown
        App.prototype.handleInputdown = function(event) {
            if(!this.checkInput(event)) return;
            var {clientX: x, clientY: y} = (event.touches && event.touches[0]) || event;
            this.inputPos = {x, y};
            clearTimeout(this.tripleInputTimeoutId);
            if(this.waitingForTripleInput && !this.didInputMove()) {
                this.updateKeys(event);
                clearTimeout(this.longInputTimoutId);
                clearTimeout(this.doubleInputTimoutId);
                this.waitingForTripleInput = false;
                this.handleAltSpecialInput(event);
                return;
            }
            delegateInputdown.call(this, event)
            if(this.waitingForDoubleInput == false) {
                this.waitingForTripleInput = true;
                this.tripleInputTimeoutId = setTimeout(() => (this.waitingForTripleInput = false), App.DoubleInputTimeout);
            }
        }
        App.prototype.smartSelectCell = function(cell, skipDeselect = false) {
            //console.info('App.smartSelectCell(cell, skipDeselect = %s);', skipDeselect === true, cell, this.tool);
            const getCosmetics = c => this.puzzle.currentPuzzle.cellCosmetics.filter(cc => c.row === cc.rc[0] && c.col === cc.rc[1]);
			const cosmeticsEqual = ({cosmetic: c1}) => ({cosmetic: c2}) => true
				&& c1.rounded === c2.rounded
				&& c1.backgroundColor === c2.backgroundColor
				&& c1.borderColor === c2.borderColor
				&& c1.width === c2.width
				&& c1.height === c2.height
				&& c1.text === c2.text;
			const makeSelector = (cell, tool) => {
				if(Array.isArray(tool)) return tool.reduce((acc, cur) => acc || makeSelector(cell, cur), undefined);
				var selFn, selVal;
				switch(tool) {
					case 'normal':
						selVal = cell.propGet('given') || cell.propGet(tool) || '';
						selFn = c => c.propContains('given', selVal) || c.propContains(tool, selVal);
						break;
					case 'centre':
						selVal = [...cell.propGet(tool)];
						if(selVal.length === 0) selVal = '';
						selFn = c => c.propVisible(tool) && selVal.every(val => c.propContains(tool, val));
						break;
					case 'corner':
						selVal = [...cell.propGet(tool)];
						if(selVal.length === 0) selVal = '';
						selFn = c => c.propVisible(tool) && selVal.some(val => c.propContains(tool, val));
						break;
					case 'colour':
						selVal = [...cell.propGet(tool)];
						if(selVal.length === 0) selVal = '';
						selFn = c => c.propVisible(tool) && selVal.some(val => c.propContains(tool, val)) && c.propGet(tool).every(val => selVal.includes(val));
						break;
					case 'cosmetic':
						selVal = getCosmetics(cell);
						if(selVal.length === 0) selVal = '';
						selFn = c => !selVal.some(cc1 => getCosmetics(c).find(cosmeticsEqual(cc1)) === undefined);
						break;
				}
				return (selVal === '') ? undefined : selFn;
			};
			var cells = [], selector;
			switch(this.tool) {
				case 'normal': selector = makeSelector(cell, ['normal', 'colour', 'centre', 'corner', 'cosmetic']); break;
				case 'corner': selector = makeSelector(cell, ['normal', 'corner', 'centre', 'colour', 'cosmetic']); break;
				case 'centre': selector = makeSelector(cell, ['normal', 'centre', 'corner', 'colour', 'cosmetic']); break;
				case 'colour': selector = makeSelector(cell, ['colour', 'normal', 'centre', 'corner', 'cosmetic']); break;
			}
			if(selector !== undefined) cells = this.grid.getCellList().filter(selector);
			if(cells.length > 0) {
				if(!skipDeselect) this.deselect();
				this.select(cells);
			}
        }
        App.prototype.smartSelectCellGroup = function(cell, skipDeselect = false) {
            const getCosmetics = c => this.puzzle.currentPuzzle.cellCosmetics.filter(cc => c.row === cc.rc[0] && c.col === cc.rc[1]);
			const cosmeticsEqual = ({cosmetic: c1}) => ({cosmetic: c2}) => true
				&& c1.rounded === c2.rounded
				&& c1.backgroundColor === c2.backgroundColor
				&& c1.borderColor === c2.borderColor
				&& c1.width === c2.width
				&& c1.height === c2.height
				&& c1.text === c2.text;
            const makeSelector = (cell, tool) => {
                if(Array.isArray(tool)) return tool.reduce((acc, cur) => acc || makeSelector(cell, cur), undefined);
                var selFn, selVal;
                switch(tool) {
                    case 'normal':
                        selVal = cell.propGet('given') || cell.propGet(tool) || '';
                        selFn = c => c.propContains('given', selVal) || c.propContains(tool, selVal) ||
                                     (c.propVisible('corner') && c.propContains('corner', selVal)) ||
                                     (c.propVisible('centre') && c.propContains('centre', selVal));
                        break;
                    case 'centre':
                        selVal = [...cell.propGet(tool)];
                        if(selVal.length === 0) selVal = '';
                        selFn = c => (c.propVisible('corner') && selVal.every(val => c.propContains('corner', val))) ||
                                     (c.propVisible('centre') && selVal.every(val => c.propContains('centre', val)));
                        break;
                    case 'corner':
                        selVal = [...cell.propGet(tool)];
                        if(selVal.length === 0) selVal = '';
                        selFn = c => (c.propVisible('corner') && selVal.some(val => c.propContains('corner', val))) ||
                                     (c.propVisible('centre') && selVal.some(val => c.propContains('centre', val)));
                        break;
                    case 'colour':
                        selVal = [...cell.propGet(tool)];
						if(selVal.length === 0) selVal = '';
						selFn = c => c.propVisible(tool) && selVal.some(val => c.propContains(tool, val));
						break;
					case 'cosmetic':
						selVal = getCosmetics(cell);
						if(selVal.length === 0) selVal = '';
						selFn = c => !selVal.some(cc1 => getCosmetics(c).find(cosmeticsEqual(cc1)) === undefined);
						break;
                }
                return (selVal === '') ? undefined : selFn;
            };
            var cells = [], selector;
            switch(this.tool) {
                case 'normal': selector = makeSelector(cell, ['normal', 'colour', 'centre', 'corner', 'cosmetic']); break;
                case 'corner': selector = makeSelector(cell, ['normal', 'corner', 'centre', 'colour', 'cosmetic']); break;
                case 'centre': selector = makeSelector(cell, ['normal', 'centre', 'corner', 'colour', 'cosmetic']); break;
                case 'colour': selector = makeSelector(cell, ['colour', 'normal', 'centre', 'corner', 'cosmetic']); break;
            }
            if(selector !== undefined) cells = this.grid.getCellList().filter(selector);
            if(cells.length > 0) {
                if(!skipDeselect) this.deselect();
                this.select(cells);
            }
        };
        App.prototype.handleAltSpecialInput = function(event) { // triple or longer input
			//console.info('App.handleAltSpecialInput(event);', event);
			const pos = this.inputPos, prevRC = this.xyToRC(pos.x, pos.y);
			const cell = this.grid.getCell(prevRC.r, prevRC.c);
			if(cell) this.smartSelectCellGroup(cell, this.controlPressed);
        }
    })
})();