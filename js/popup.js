import send from "./sender.js"

const toast = new bootstrap.Toast(document.getElementById('toast'), { delay: 3000 })

async function display() {
    const files = new Array();
    let token;
    let domain;
    let option;

    await chrome.storage.local.get(["Blobs", "Toot", "AccessToken", "Domain", "Setting"]).then(async (items) => {
        for (let item of items.Blobs) {
            var blob = await fetch(item).then(i => i.blob())
            files.push(blob)

            var col = document.createElement("div");
            col.className = "col-5"
            var img = document.createElement("img");
            img.src = item;
            img.className = "ratio ratio-4x3 img-fluid img-thumbnail"
            col.appendChild(img)
            document.getElementById("img-container").appendChild(col);
        }

        document.getElementById("toot").value = items.Toot;
        token = items.AccessToken
        domain = items.Domain
        option = items.Setting

        document.getElementById("visibility").value = option.visibility
        document.getElementById("sensitive").value = option.sensitive
    });

    document.getElementById("apply").addEventListener('click', () => {
        try {
            option.visibility = document.getElementById("visibility").value
            option.sensitive = document.getElementById("sensitive").value

            const progress = document.getElementById("progress")
            progress.hidden = false
            const bar = document.getElementById("bar")

            send(domain, token, document.getElementById("toot").value, files, option, (progress) => {
                bar.style.width = progress + "%"
            }).then((res) => {
                if (option.autoclose) {
                    window.close();
                }
                toast.show()
            })
        } catch (error) {
            console.log(error)
            alert("エラーが発生しました")
            return
        }
    })
}

display();