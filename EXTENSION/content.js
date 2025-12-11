console.log("🔧 Multi-Captcha Solver aktif!");

// ÇÖZÜLECEK CAPTCHA LİSTESİ
const CAPTCHA_JOBS = [
    {
        img: "#c_pages_account_login_ctl02_ctl00_botdetectlogincaptcha_CaptchaImage",
        input: "#ctl02_ctl00_txtCaptchaCodeTextBox",
    },
    {
        img: "#c_pages_bildirimislemleri_toplamabildirimislemleri_contentplaceholder1_wizard1_botdetectbildirimcaptcha_CaptchaImage",
        input: "#ContentPlaceHolder1_Wizard1_txtCaptchaCodeTextBox",
    }
];

// CANVAS → BASE64
function getBase64FromImage(img) {
    return new Promise((resolve, reject) => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;

        if (c.width === 0 || c.height === 0) {
            return reject("⚠️ Görüntü yüklenmemiş (naturalWidth=0)");
        }

        try {
            const ctx = c.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const b64 = c.toDataURL("image/png").replace("data:image/png;base64,", "");
            resolve(b64);
        } catch (err) {
            reject("Canvas çizim hatası: " + err);
        }
    });
}

// TEK CAPTCHA ÇÖZEN FONKSİYON
async function solveSingleCaptcha(job) {
    const img = document.querySelector(job.img);
    const input = document.querySelector(job.input);

    if (!img || !input) return;

    if (!img.complete || img.naturalWidth === 0) {
        console.log("⚠️ Captcha yüklenmemiş:", job.img);
        return;
    }

    console.log("⏳ Çözülüyor:", job.img);

    let base64;
    try {
        base64 = await getBase64FromImage(img);
    } catch (e) {
        console.log("❌ Base64 alınamadı:", e);
        return;
    }

    chrome.runtime.sendMessage({ type: "solve", image: base64 }, (response) => {
        if (!response) return console.log("❌ Background dönmedi.");
        if (response.error) return console.log("❌ API hatası:", response.error);

        console.log("🤖 Çözüm:", response.result, "→", job.input);
        input.value = response.result;
    });
}

// TÜM CAPTCHA'LARI İZLEYEN SİSTEM
function startWatcher() {
    CAPTCHA_JOBS.forEach((job) => {
        function attach() {
            const img = document.querySelector(job.img);

            if (!img) {
                setTimeout(attach, 400);
                return;
            }

            img.onload = () => {
                console.log("🟢 Captcha yüklendi:", job.img);
                solveSingleCaptcha(job);
            };

            img.onerror = () => {
                console.log("❌ Captcha bozuk:", job.img);
            };

            if (img.complete && img.naturalWidth > 0) {
                console.log("🟢 İlk captcha hazır:", job.img);
                solveSingleCaptcha(job);
            }
        }

        attach();
    });
}

startWatcher();
