chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "solve") {
        fetch("http://93.88.201.221:8000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: msg.image })
        })
        .then(r => r.json())
        .then(data => sendResponse({ result: data.result }))
        .catch(err => sendResponse({ error: err.toString() }));

        return true; // async
    }
});
