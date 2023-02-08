// twitter.conにぶち込まれるスクリプト

console.log("twistdon : 開始")
let setting;
chrome.runtime.sendMessage({ "mode": 'fetch' }).then((response) => {
    setting = response.setting
    console.log("twistdon : 設定ロード完了")
})

function init() {
    // ツイート画面を召喚すると[id="layers"]の2番目の要素が生えてくるので、それを監視します
    const observedElement = document.getElementById("layers");

    if (!observedElement) {
        setTimeout(init, 1000)
        return;
    }

    const observer = new MutationObserver(function () {
        setButton()
    });

    observer.observe(observedElement, { subtree: false, childList: true })

    console.log("twistdon : 初期化完了")
    setButton();
}

function setButton() {
    setTimeout(() => {
        for (var button of document.querySelectorAll('[data-testid="tweetButton"]')) {
            if (setting.onebutton) {
                button.addEventListener('click', (event) => {
                    if (!event.currentTarget.ariaDisabled) { toot(); event.currentTarget.ariaDisabled = true; }
                }, true);
            } else {
                if (button.parentNode.getElementsByClassName('twistdon').length == 0) {
                    const tootButton = Button(button.cloneNode(true))
                    button.before(tootButton);

                    const observer = new MutationObserver(() => {
                        tootButton.style.opacity = getComputedStyle(button).opacity
                        tootButton.ariaDisabled = button.ariaDisabled
                    })
                    observer.observe(button, { subtree: false, childList: false, attributes: true })
                }
            }
            if (setting.button_tweet) {
                getGrandChild(button).textContent = setting.button_tweet
            } else {
                const ticon = document.querySelector('[aria-label="Twitter"]').querySelector('svg').cloneNode(true)
                button.childNodes.forEach(node => node.remove())
                button.appendChild(ticon)
            }
        }
    }, 500)
}

function Button(button) {
    button.className += " twistdon";
    if (setting.button_toot) {
        getGrandChild(button).textContent = setting.button_toot
    } else {
        const icon = document.createElement('img')
        icon.src = chrome.runtime.getURL('images/twist.svg');
        icon.style.height = '24px'
        icon.style.width = '24px'
        button.childNodes.forEach(node => node.remove())
        button.style.justifyContent = 'center'
        button.appendChild(icon)
    }
    
    button.setAttribute('data-testid', 'tootButton')
    button.addEventListener('click', (event) => {
        if (!event.currentTarget.ariaDisabled) { toot();  event.currentTarget.ariaDisabled = true; }
    });
    return button;
}

function getGrandChild(node) {
    return node.childNodes.length == 1 ? getGrandChild(node.childNodes[0]) : node;
}

function toot() {
    const node = getLayerRootNode()
    const toot = getToot(node)
    const media = getMedia(node)
    chrome.runtime.sendMessage({ "mode" : 'toot', "toot": toot, "blobs": media })
}

function getLayerRootNode() {
    const node = Array.from(document.getElementById("layers").childNodes).filter(node => node.querySelectorAll('[data-testid="tweetButton"]').length == 1)
    if (node.length != 1) {
        throw new Error("twistdon : ツイートが取得できませんでした\n")
    }
    return node[0]
}

function getToot(node) {
    let toot = "";
    for (let line of node.querySelector('[data-contents="true"]').childNodes) {
        toot += line.textContent + '\n';
    }
    return toot.slice(0, -1)
}

function getMedia(node) {
    var blobs = new Array();
    for (var mediaNode of node.querySelectorAll('[aria-label="メディア"]')) {
        var blob = mediaNode.querySelector('img').getAttribute('src');
        blobs.push(blob)
    }
    return blobs
}

window.addEventListener("load", init, false);