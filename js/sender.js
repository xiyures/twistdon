export default async function send(domain, token, text, files, option = { visibility: "private", sensitive: "false" }, progress = (prog) => { }) {

    const mediaIds = new Array();
    const processingIds = new Array();
    const baseUrl = "https://" + domain
    progress(10)

    let postedCountForProgress = 0
    await Promise.all(files.map(async file => {
        const res = await uploadMedia(baseUrl, token, file, 3)
        const json = await res.json()
        switch (res.status) {
            case 200:
                mediaIds.push(json.id)
                break;
            case 202:
                mediaIds.push(json.id)
                processingIds.push(json.id)
                break;
            default:
                alert("メディアのアップロードに失敗しました");
                return
        }
        progress((++postedCountForProgress / files.length) * 48 + 10)
    }))

    await checkProcessingMedias(processingIds, baseUrl, token, 30, 1000)
    progress(75)
    const res = await uploadToot(baseUrl, token, text, mediaIds, option)
    progress(100)
    return res
}

async function uploadToot(baseUrl, token, text, mediaIds, option) {
    const toot = {}
    if (text.length > 0) {
        toot.status = text
    }
    if (mediaIds.length > 0) {
        toot.media_ids = mediaIds
    }
    toot.visibility = option.visibility
    toot.sensitive = option.sensitive

    var res = await postStatus(baseUrl, token, toot)
    if (res.status != 200) {
        throw new Error("送信に失敗しました")
    }
    return res.json()
}

// エラー時 合計count回までリトライ
async function uploadMedia(baseUrl, token, blob, count) {
    let res = await postMedia(baseUrl, token, blob)

    if ([200, 202].indexOf(res.status) < 0 && count > 1) {
        res = await uploadMedia(baseUrl, token, blob, count - 1)
    }
    return res
}

// mediaの複数形はmedia
// interval: 再送信間隔
async function checkProcessingMedias(processingIds, baseUrl, token, count, interval) {
    await new Promise((resolve) => setTimeout(() => resolve(), interval))

    let underProcessing = new Array();
    for (let id of processingIds) {
        let res = await getMediaState(baseUrl, id, token)
        switch (res.status) {
            case 200:
                break;
            case 206:
                underProcessing.push(id)
                break;
            default:
                throw new Exception("サーバーとの通信に失敗しました")
        }
    }
    if (underProcessing.length > 0) {
        if (count > 1) {
            underProcessing = await checkProcessingMedias(underProcessing, baseUrl, token, count - 1);
        } else {
            throw new Exception("タイムアウトしました")
        }
    }

    return underProcessing;
}


async function postMedia(baseUrl, token, file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(baseUrl + '/api/v2/media', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        referrerPolicy: 'no-referrer',
        body: formData
    })
    return response;
}

async function getMediaState(baseUrl, id, token) {
    const response = await fetch(baseUrl + '/api/v1/media/' + id, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        referrerPolicy: 'no-referrer',
    })
    return response;
}

async function postStatus(baseUrl, token, data = {}) {
    const response = await fetch(baseUrl + '/api/v1/statuses', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    })
    return response;
}
