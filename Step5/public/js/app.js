function init() {
    // Global variables
    let webcamStream;
    const appContainer = document.getElementById('appContainer');
    const restartButtonElement = document.querySelector('.restart-button');
    const startButtonElement = appContainer.querySelector('.start-button');
    const picks = ["rock", "paper", "scissors", "lizard", "spock"];

    const getEnginePick = () => picks[Math.floor(Math.random() * picks.length)];

    const setLayout = (visibleElements) => {
        const elements = [
            "video", "canvas", ".user-pick",
            ".bot-player", ".bot-pick",
            ".start-button", ".app-counter", ".restart-button"
        ];

        for (let i = 0; i < elements.length; i++) {
            const el = appContainer.querySelector(elements[i]);
            if (visibleElements.indexOf(elements[i]) == -1) {
                el.classList.add('hide');
            } else {
                el.classList.remove('hide');
            }
        }
    };

    const startBattle = () => {
        if (!webcamStream) return;

        const videoElement = document.querySelector("video");
        const canvasElement = document.querySelector("canvas");
        const timerTick = 3000;

        setLayout(["video", ".app-counter", ".bot-player"]);

        const counterTimerTick = function counterTimerTick() {
            takePhoto(videoElement, canvasElement);
            setLayout(["canvas", ".app-counter", ".bot-player"]);
            submitImageFromCanvas(canvasElement);
        };

        setTimeout(counterTimerTick, timerTick);
    };

    const processPrediction = (prediction, enginePick) => {
        const userPickElement = appContainer.querySelector('.user-pick');
        const enginePickElement = appContainer.querySelector('.bot-pick-img');

        userPickElement.src = 'img/user/' + prediction + '.png';
        enginePickElement.src = 'img/bot/' + enginePick + '.png';

        setLayout(["canvas", ".user-pick", ".app-counter", ".bot-pick", ".restart-button"]);
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
        const canvasContext = canvasElement.getContext('2d');
        const videoSettings = webcamStream.getVideoTracks()[0].getSettings();
        canvasContext.drawImage(videoElement,
            0, 0, videoSettings.width, videoSettings.height,
            0, 0, canvasElement.width, canvasElement.height);
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
                },
                // errorCallback
                function(err) {
                    console.log("The following error occured: " + err);
                }
            );
        } else {
            console.log("getUserMedia not supported");
        }
    }

    const startLayout = () => setLayout(["video", ".start-button", ".bot-player"]);
    startLayout();
    bindCamera();
    startButtonElement.addEventListener("click", startBattle);
    restartButtonElement.addEventListener("click", startLayout);
}

function onDocumentReady(fn) {
    if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

onDocumentReady(init);