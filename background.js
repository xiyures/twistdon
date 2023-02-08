import { defaultSetting } from "./js/setting.js"
import send from "./js/sender.js"

let url = ""
function init() {
    initSetting()

    try {
        chrome.scripting.registerContentScripts([{
            allFrames: true, id: "twistdon-script", js: ["js/twitter.js"], matches: ["https://twitter.com/*", "https://mobile.twitter.com/*"]
        }])
    } catch (error) {
        console.error(error)
    }

    chrome.notifications.onButtonClicked.addListener((id, index) => {
        if (id === "twistdon-backgroundPostSuccess" && index === 0) {
            chrome.windows.create({
                url: url,
                type: 'popup',
            });
        }
    })
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.mode) {
        case 'fetch':
            getSetting().then((setting) => {
                sendResponse({ setting: setting })
            })
            break;

        case 'toot':
            chrome.storage.local.set({
                ["Toot"]: msg.toot,
                ["Blobs"]: msg.blobs,
            });

            chrome.storage.local.get(["AccessToken", "Domain", "Setting"]).then(async (items) => {
                if (!items.Domain || !items.AccessToken) {
                    chrome.runtime.openOptionsPage()
                } else {
                    if (!items.Setting.direct) {
                        chrome.windows.create({
                            url: 'html/popup.html',
                            type: 'popup',
                        });
                    } else {
                        url = "https://" + items.Domain
                        const files = new Array()
                        for (let blob of msg.blobs) {
                            files.push(await fetch(blob).then(i => i.blob()))
                        }
                        try {
                            const res = await send(items.Domain, items.AccessToken, msg.toot, files, {
                                visibility: items.Setting.visibility, sensitive: items.Setting.sensitive
                            })
                            chrome.notifications.create(
                                "twistdon-backgroundPostSuccess", {
                                type: "basic", title: 'twistdon', message: "投稿しました", iconUrl: './images/twist_w.png', silent: true, buttons: [{ title: "開く" }]
                            })
                        } catch (error) {
                            console.error(error)
                            chrome.notifications.create(
                                "twistdon-backgroundPostFailed", {
                                type: "basic", title: 'twistdon', message: "投稿に失敗しました", iconUrl: './images/twist_w.png', silent: true
                            })
                        }


                    }
                }
            })
            break;
    }
    return true;
});

function getSetting() {
    return chrome.storage.local.get(["Setting"]).then((items) => {
        if (!items.Setting) {
            chrome.storage.local.set({
                ["Setting"]: defaultSetting
            });
        }
        let setting = items.Setting ? items.Setting : defaultSetting
        return setting
    })
}

const initSetting = getSetting

init()
console.log("twistdon : start")