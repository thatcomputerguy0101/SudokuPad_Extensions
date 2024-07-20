// ==UserScript==
// @name         SudokuPad Extensions
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Extension event hook for Sven's SudokuPad
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

(function() {
    'use strict';

    let getAppVersionUnder = (version) => {
        let appVersion = document.title.match(/(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/)
        let maxVersion = version.match(/(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/)

        return appVersion.major <= maxVersion.major && appVersion.minor <= maxVersion.minor && appVersion.patch <= maxVersion.patch
    }

    let dispatchInitialization = () => {
//        console.log("Initializing extensions")
        document.body.dispatchEvent(new CustomEvent("appPrepared"))
    }

    if (getAppVersionUnder("0.130.0")) {
        // Wait until the main script is loading to override the method for the event hook
        let addScriptListener = mutations => {
            for (let mutation of mutations) {
                if (mutation.addedNodes[0] && mutation.addedNodes[0].tagName == "SCRIPT" && mutation.addedNodes[0].src == "" && mutation.addedNodes[0].innerText.match(/new App\(\)/m)) {
                    scriptObserver.disconnect()
                    dispatchInitialization()
                }
            }
        };


        let scriptObserver = new MutationObserver(addScriptListener);
        scriptObserver.observe(document.body, {childList: true});
    } else {
        // Startup is run on DOMContentLoaded, so just add a capturing event handler to run before the app's one
        addEventListener("DOMContentLoaded", dispatchInitialization, {once: true})
    }
})();
