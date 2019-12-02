function init() {
    // Global variables
    let webcamStream;
    const appContainer = document.getElementById('appContainer');
    const counterElement = appContainer.querySelector('.app-counter');
    const startButtonElement = appContainer.querySelector('.start-battle');
    const restartButtonElement = document.querySelector('.restart-button');

    const userPickElement = appContainer.querySelector('.user-pick');
    const enginePickElement = appContainer.querySelector('.bot-pick > img');
    const enginePlayerElement = appContainer.querySelector('.bot-player');
    const resultsElement = appContainer.querySelector('.pick-result');
    const counterTextElement = counterElement.querySelector('.app-counter-text');

    const getEnginePick = () => {
        return picks[Math.floor(Math.random() * picks.length)];
    };

    const resultText = {
        "winner": "you win!!",
        "loser": "you lose!!",
        "draw": "tie!!"
    };

    const picks = ["rock", "paper", "scissors", "lizard", "spock"];

    const getWinner = (userPick, enginePick) => {
        const winnerScheme = {
                "rock": ["scissors", "lizard"],
                "scissors": ["paper", "lizard"],
                "paper": ["rock", "spock"],
                "lizard": ["paper", "spock"],
                "spock": ["rock", "scissors"]
            },
            userPickValue = userPick.toLowerCase(),
            enginePickValue = enginePick.toLowerCase();

        if (userPick === enginePick) {
            return "draw";
        }

        if (winnerScheme[userPickValue].indexOf(enginePickValue) != -1) {
            return "winner";
        }

        return "loser";
    };

    const startCounter = () => {
        let counter = 0;
        const counterStart = 0;
        const counterStop = 3;
        const counterStep = 1;
        const timerTick = 1000;

        const videoElement = document.querySelector("video");
        const canvasElement = document.querySelector("canvas");

        let counterTimer;

        // Reset elements
        canvasElement.classList.add('hide');
        startButtonElement.classList.add('hide');
        counterElement.classList.remove('hide');

        userPickElement.classList.add('hide');
        enginePickElement.parentElement.classList.add('hide');

        const counterTimerTick = function counterTimerTick() {
            if (counterTimer) {
                clearTimeout(counterTimer);
            }
            counter += counterStep;
            counterTextElement.innerHTML = counter;
            if (counter >= counterStop) {
                takePhoto(videoElement, canvasElement);
                videoElement.classList.add('hide');
                return;
            }
            counterTimer = setTimeout(counterTimerTick, timerTick);
        };

        counter = counterStart;
        counterTimerTick();
    };

    const processPrediction = (prediction, enginePick) => {
        counterTextElement.innerHTML = 'VS';
        userPickElement.src = 'img/user/' + prediction + '.png';
        enginePickElement.src = 'img/user/' + enginePick + '.png';

        // Update results
        const result = getWinner(prediction, enginePick);
        const resultTextElement = resultsElement.firstElementChild;
        resultTextElement.className = result;
        resultTextElement.innerText = resultText[result];

        userPickElement.classList.remove('hide');
        enginePickElement.parentElement.classList.remove('hide');
        enginePlayerElement.classList.add('hide');
        resultsElement.classList.remove('hide');
        restartButtonElement.classList.remove('hide');
    };

    const submitImageFromCanvas = (canvasElement) => {
        const request = new XMLHttpRequest();
        request.open('POST', "/predict", true);
        request.setRequestHeader('Content-Type', 'application/octet-stream');
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                // Success!
                const prediction = JSON.parse(request.responseText).prediction.toLowerCase();
                const enginePick = getEnginePick();
                processPrediction(prediction, enginePick);
            } else {
                console.error(request);
            }
        };

        request.onerror = function(error) {
            console.error(error);
        };

        canvasElement.toBlob(function(blob) {
            request.send(blob);
        });
    };

    const takePhoto = (videoElement, canvasElement) => {
        canvasElement.classList.remove('hide');
        const canvasContext = canvasElement.getContext('2d');
        const videoSettings = webcamStream.getVideoTracks()[0].getSettings();
        canvasContext.drawImage(videoElement,
            0, 0, videoSettings.width, videoSettings.height,
            0, 0, canvasElement.width, canvasElement.height);
        submitImageFromCanvas(canvasElement);
    };

    // Initialize camera
    function bindCamera() {
        const videoElement = document.querySelector('video');
        // getMedia polyfill
        navigator.getUserMedia = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);

        // Check that getUserMedia is supported
        if (navigator.getUserMedia) {
            navigator.getUserMedia(
                // constraints
                {
                    video: { facingMode: 'environment' },
                    audio: false
                },
                // successCallback
                function(localMediaStream) {
                    try {
                        videoElement.srcObject = localMediaStream;
                    } catch (error) {
                        videoElement.src = window.URL.createObjectURL(localMediaStream);
                    }
                    webcamStream = localMediaStream;
                    // startCounter();
                },
                // errorCallback
                function(err) {
                    console.log("The following error occured: " + err);
                }
            );
        } else {
            console.log("getUserMedia not supported");
            appContainer.querySelector(".appCanvasContainer").classList.add('hide');
            appContainer.querySelector(".upload-photo").classList.remove('hide');
            const canvasElement = document.querySelector("canvas");
            const canvasContext = canvasElement.getContext('2d');
            const image = new Image();
            image.onload = () => {
                appContainer.querySelector(".appCanvasContainer").classList.remove('hide');
                canvasElement.classList.remove('hide');
                canvasContext.drawImage(image,
                    0, 0, image.width, image.height,
                    0, 0, canvasElement.width, canvasElement.height);
                submitImageFromCanvas(canvasElement);
                URL.revokeObjectURL(image.src);
            };
            document.getElementById("photoUpload").addEventListener('change', (event) => {
                const file = event.target.files[0];
                image.src = URL.createObjectURL(file);
            });
        }
    }

    bindCamera();
    startButtonElement.addEventListener("click", startCounter);
}

function onDocumentReady(fn) {
    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

onDocumentReady(init);