const elDomain = document.getElementById("url");
const elAuthButton = document.getElementById("authorization");
const elCode = document.getElementById("authorization-code");
const elApplyButton = document.getElementById("apply");

const client_name = "twistdon";

const redirect_uris = "urn:ietf:wg:oauth:2.0:oob"
const scopes = "write:statuses write:media"
const grant_type = "authorization_code";

let client_id;
let client_secret;

let token;

let setting;

elAuthButton.addEventListener("click", fetchAccessCode);
elApplyButton.addEventListener("click", fetchToken);

const toasts = {
    setting: new bootstrap.Toast(document.getElementById('settingToast'), { delay: 3000 }),
    auth: new bootstrap.Toast(document.getElementById('authToast'), { delay: 3000 }),
    error: new bootstrap.Toast(document.getElementById('errorToast'), { delay: 3000 }),
}

const items = await chrome.storage.local.get(["Domain", "ClientId", "ClientSecret", "AuthCode", "Setting"])
if (items.Domain) {
    elDomain.value = items.Domain
}
if (items.ClientId) {
    client_id = items.ClientId
}
if (items.ClientSecret) {
    client_secret = items.client_secret
}
if (items.AuthCode) {
    elCode.value = items.AuthCode
}
setting = items.Setting

forEachSetting((k, e) => {
    switch (e.tagName) {
        case 'INPUT':
            switch (e.getAttribute('type')) {
                case 'checkbox':
                    e.checked = setting[k]
                    break
                case 'text':
                    e.value = setting[k]
                    break
            }
            break;
        case 'SELECT':
            e.value = setting[k]
            break;
    }
})

document.getElementById("save").addEventListener("click", () => {
    forEachSetting((k, e) => {
        switch (e.tagName) {
            case 'INPUT':
                switch (e.getAttribute('type')) {
                    case 'checkbox':
                        setting[k] = e.checked
                        break
                    case 'text':
                        setting[k] = e.value
                        break
                }
                break;
            case 'SELECT':
                setting[k] = e.value
                break;
        }
    })

    chrome.storage.local.set({
        ["Setting"]: setting,
    }).then(
        () => toasts['setting'].show()
    )
})

function forEachSetting(proc) {
    for (let key of Object.keys(setting)) {
        let element = document.getElementById(key)
        proc(key, element)
    }
}

function fetchAccessCode(event) {
    let domain = elDomain.value.endsWith('/') ? elDomain.value.slice(0, -1) : elDomain.value
    postData("https://" + domain + '/api/v1/apps', {
        client_name: client_name, redirect_uris: redirect_uris, scopes: scopes
    }).then((data) => {
        client_id = data.client_id;
        client_secret = data.client_secret;

        const params = {
            client_id: client_id,
            scope: scopes,
            redirect_uri: redirect_uris,
            response_type: "code"
        }

        const url = "https://" + domain + '/oauth/authorize?' + new URLSearchParams(params).toString();

        chrome.windows.create({
            url: url,
            type: 'popup',
            width: 400,
            height: 600
        });
    });
}

// ローカルストレージに保存しています 多分大丈夫です
function fetchToken(event) {
    let domain = elDomain.value.endsWith('/') ? elDomain.value.slice(0, -1) : elDomain.value
    postData('https://' + domain + '/oauth/token', {
        client_id: client_id, client_secret: client_secret, redirect_uri: redirect_uris, grant_type: grant_type, code: elCode.value, scope: scopes
    }).then((data) => {
        token = data.access_token;

        chrome.storage.local.set({
            ["AccessToken"]: token,
            ["Domain"]: domain,
            ["ClientId"]: client_id,
            ["ClientSecret"]: client_secret,
            ["AuthCode"]: elCode.value
        }).then(() => {
            toasts['auth'].show()
        }
        ).catch((error) => {
            console.error(error)
            toasts['error'].show()
        })
    });
}

async function postData(url, data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    })
    return response.json();
}